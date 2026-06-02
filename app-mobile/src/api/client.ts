import axios, { AxiosError } from "axios";
import { getToken, getUserInfo } from "../storage/auth";
import { logEvent } from "../utils/logger";

declare const process: {
  env: Record<string, string | undefined>;
};

type RequestConfig = {
  params?: Record<string, unknown>;
};

type ApiResponse<T = any> = {
  data: T;
};

// NOTE:
// Use direct `process.env.EXPO_PUBLIC_*` access so Expo can inline values in release builds.
const SUPABASE_URL_RAW = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY_RAW = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const SUPABASE_URL = (SUPABASE_URL_RAW || "").trim().replace(/\/+$/, "");
export const SUPABASE_ANON_KEY = (SUPABASE_ANON_KEY_RAW || "").trim();
export const IS_SUPABASE_CONFIGURED = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

if (!IS_SUPABASE_CONFIGURED) {
  logEvent({
    level: "warn",
    message: "Supabase env missing. Configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in EAS env (preview/production).",
  });
}

export class ApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

const http = axios.create({
  baseURL: SUPABASE_URL,
  timeout: 20000,
});

function requireConfig() {
  if (!IS_SUPABASE_CONFIGURED) {
    throw new ApiError(
      "Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no ambiente de build (EAS)."
    );
  }
}

function authHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
}

function authHeadersWithToken(token: string) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function ok<T>(data: T): ApiResponse<T> {
  return { data };
}

function normalizeError(err: unknown, fallback: string): ApiError {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError;
    const status = ax.response?.status;
    const data = ax.response?.data;
    return new ApiError(fallback, status, data);
  }
  if (err instanceof ApiError) {
    return err;
  }
  return new ApiError(fallback);
}

async function rpc<T = unknown>(fn: string, payload: Record<string, unknown> = {}): Promise<T> {
  requireConfig();
  try {
    const token = await getToken();
    const headers = token ? authHeadersWithToken(token) : authHeaders();
    const response = await http.post<T>(`/rest/v1/rpc/${fn}`, payload, { headers });
    return response.data;
  } catch (err) {
    logEvent({
      level: "error",
      message: "Supabase RPC failed",
      meta: { fn },
    });
    throw normalizeError(err, `Falha ao executar operacao ${fn}`);
  }
}

function extractId(path: string, pattern: RegExp): number | null {
  const match = path.match(pattern);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function extractTextId(path: string, pattern: RegExp): string | null {
  const match = path.match(pattern);
  return match ? decodeURIComponent(match[1]) : null;
}

async function currentUserId(): Promise<number | null> {
  const info = await getUserInfo();
  return typeof info?.user_id === "number" ? info.user_id : null;
}

const api = {
  async get<T = any>(path: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    try {
      if (path === "/catalog/services") {
        return ok(await rpc<T>("mobile_catalog_services"));
      }

      if (path === "/clients/search") {
        const term = String(config?.params?.term || "");
        return ok(await rpc<T>("mobile_clients_search", { p_term: term }));
      }

      if (path.startsWith("/vehicles/by-plate/")) {
        const placa = decodeURIComponent(path.replace("/vehicles/by-plate/", ""));
        const data = await rpc<T>("mobile_vehicle_by_plate", { p_placa: placa });
        if (!data) {
          throw new ApiError("Veiculo nao encontrado", 404);
        }
        return ok(data);
      }

      const clientId = extractId(path, /^\/clients\/(\d+)$/);
      if (clientId !== null) {
        const data = await rpc<T>("mobile_client_details", { p_client_id: clientId });
        if (!data) {
          throw new ApiError("Cliente nao encontrado", 404);
        }
        return ok(data);
      }

      if (path === "/allocation/pending-vehicles") {
        return ok(await rpc<T>("mobile_pending_vehicles"));
      }

      const veiculoAreaId = extractId(path, /^\/allocation\/areas\/(\d+)$/);
      if (veiculoAreaId !== null) {
        return ok(await rpc<T>("mobile_pending_areas", { p_veiculo_id: veiculoAreaId }));
      }

      if (path === "/allocation/funcionarios") {
        return ok(await rpc<T>("mobile_funcionarios"));
      }

      if (path === "/allocation/boxes") {
        return ok(await rpc<T>("mobile_boxes_available"));
      }

      if (path === "/queues") {
        return ok(await rpc<T>("mobile_queues"));
      }

      if (path === "/boxes/active") {
        return ok(await rpc<T>("mobile_boxes_active"));
      }

      const boxDetailId = extractId(path, /^\/boxes\/(\d+)\/details$/);
      if (boxDetailId !== null) {
        return ok(await rpc<T>("mobile_box_details", { p_box_id: boxDetailId }));
      }

      if (path === "/services/completed") {
        const startDate = String(config?.params?.start_date || "");
        const endDate = String(config?.params?.end_date || "");
        return ok(
          await rpc<T>("mobile_completed_services", {
            p_start_date: startDate || null,
            p_end_date: endDate || null,
          })
        );
      }

      const termExecucaoId = extractId(path, /^\/terms\/(\d+)$/);
      if (termExecucaoId !== null) {
        const data = await rpc<T>("mobile_term_data", { p_execucao_id: termExecucaoId });
        if (!data) {
          throw new ApiError("Servico nao encontrado", 404);
        }
        return ok(data);
      }

      throw new ApiError(`Rota GET nao suportada: ${path}`, 400);
    } catch (err) {
      throw normalizeError(err, "Falha na operacao GET");
    }
  },

  async post<T = any>(path: string, body: Record<string, unknown> = {}): Promise<ApiResponse<T>> {
    try {
      if (path === "/auth/login") {
        const username = String(body.username || "");
        const password = String(body.password || "");
        requireConfig();

        const authResponse = await http.post<any>(
          "/auth/v1/token?grant_type=password",
          { email: username, password },
          { headers: authHeaders() }
        );
        const accessToken = authResponse.data?.access_token;
        const authUserId = authResponse.data?.user?.id;
        if (!accessToken || !authUserId) {
          throw new ApiError("Credenciais invalidas", 401);
        }

        const profileResponse = await http.get<any[]>(
          `/rest/v1/users?select=id,nome,email,role&auth_user_id=eq.${encodeURIComponent(authUserId)}&limit=1`,
          { headers: authHeadersWithToken(accessToken) }
        );
        const profile = profileResponse.data?.[0];
        if (!profile) {
          throw new ApiError("Usuario autenticado sem perfil operacional", 403);
        }

        return ok({
          access_token: accessToken,
          user_role: profile.role,
          user_name: profile.nome,
          user_id: null,
        } as T);
      }

      if (path === "/services/register") {
        return ok(
          await rpc<T>("mobile_services_register", {
            p_veiculo_id: body.veiculo_id,
            p_quilometragem: body.quilometragem,
            p_observacao: body.observacao || "",
            p_itens: body.itens || [],
            p_usuario_id: await currentUserId(),
          })
        );
      }

      if (path === "/clients") {
        return ok(
          await rpc<T>("mobile_client_create", {
            p_nome_empresa: body.nome_empresa,
            p_nome_fantasia: body.nome_fantasia || null,
          })
        );
      }

      if (path === "/vehicles") {
        return ok(
          await rpc<T>("mobile_vehicle_create", {
            p_placa: body.placa,
            p_empresa: body.empresa,
            p_modelo: body.modelo,
            p_ano_modelo: body.ano_modelo ?? null,
            p_nome_motorista: body.nome_motorista ?? null,
            p_contato_motorista: body.contato_motorista ?? null,
            p_cliente_id: body.cliente_id ?? null,
          })
        );
      }

      if (path === "/allocation/assign") {
        return ok(
          await rpc<T>("mobile_assign", {
            p_veiculo_id: body.veiculo_id,
            p_area: body.area,
            p_box_id: body.box_id,
            p_funcionario_id: body.funcionario_id,
            p_usuario_id: await currentUserId(),
          })
        );
      }

      const addServiceBoxId = extractId(path, /^\/boxes\/(\d+)\/services$/);
      if (addServiceBoxId !== null) {
        return ok(
          await rpc<T>("mobile_add_box_service", {
            p_box_id: addServiceBoxId,
            p_tipo: body.tipo,
            p_quantidade: body.quantidade || 1,
          })
        );
      }

      const unassignBoxId = extractId(path, /^\/boxes\/(\d+)\/unassign$/);
      if (unassignBoxId !== null) {
        return ok(await rpc<T>("mobile_unassign_box", { p_box_id: unassignBoxId }));
      }

      const finalizeBoxId = extractId(path, /^\/boxes\/(\d+)\/finalize$/);
      if (finalizeBoxId !== null) {
        return ok(
          await rpc<T>("mobile_finalize_box", {
            p_box_id: finalizeBoxId,
            p_obs_final: body.obs_final || "",
            p_servicos: body.servicos || [],
            p_usuario_id: await currentUserId(),
          })
        );
      }

      if (path === "/services/revert") {
        return ok(
          await rpc<T>("mobile_revert_visit", {
            p_veiculo_id: body.veiculo_id,
            p_quilometragem: body.quilometragem,
          })
        );
      }

      throw new ApiError(`Rota POST nao suportada: ${path}`, 400);
    } catch (err) {
      throw normalizeError(err, "Falha na operacao POST");
    }
  },

  async put<T = any>(path: string, body: Record<string, unknown>): Promise<ApiResponse<T>> {
    try {
      const vehicleId = extractId(path, /^\/vehicles\/(\d+)$/);
      if (vehicleId !== null) {
        return ok(
          await rpc<T>("mobile_vehicle_update", {
            p_veiculo_id: vehicleId,
            p_modelo: body.modelo ?? null,
            p_ano_modelo: body.ano_modelo ?? null,
            p_nome_motorista: body.nome_motorista ?? null,
            p_contato_motorista: body.contato_motorista ?? null,
          })
        );
      }

      const clientId = extractId(path, /^\/clients\/(\d+)$/);
      if (clientId !== null) {
        return ok(
          await rpc<T>("mobile_client_update", {
            p_client_id: clientId,
            p_nome_responsavel: body.nome_responsavel ?? null,
            p_contato_responsavel: body.contato_responsavel ?? null,
          })
        );
      }

      const vehicleCompanyId = extractId(path, /^\/vehicles\/(\d+)\/company$/);
      if (vehicleCompanyId !== null) {
        return ok(
          await rpc<T>("mobile_vehicle_company_update", {
            p_veiculo_id: vehicleCompanyId,
            p_empresa: body.empresa,
            p_cliente_id: body.cliente_id ?? null,
          })
        );
      }

      const serviceId = extractTextId(path, /^\/services\/([^/]+)\/tipo-atendimento$/);
      if (serviceId !== null) {
        return ok(
          await rpc<T>("mobile_update_tipo_atendimento", {
            p_service_id: serviceId,
            p_area: body.area,
            p_tipo_atendimento: body.tipo_atendimento,
          })
        );
      }

      throw new ApiError(`Rota PUT nao suportada: ${path}`, 400);
    } catch (err) {
      throw normalizeError(err, "Falha na operacao PUT");
    }
  },
};

export default api;

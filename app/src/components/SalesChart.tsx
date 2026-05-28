import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { money } from '../lib/crm'

type SalesChartProps = {
  data: Array<{
    nome: string
    vendas: number
    contatos: number
  }>
}

export default function SalesChart({ data }: SalesChartProps) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="nome" />
          <YAxis tickFormatter={(value) => `${Number(value) / 1000}k`} />
          <Tooltip formatter={(value) => money(Number(value))} />
          <Bar dataKey="vendas" fill="#0f766e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

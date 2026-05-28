Deno.serve(() => {
  return new Response(
    JSON.stringify({
      ok: true,
      service: 'crm-capital-truck-center',
      checkedAt: new Date().toISOString(),
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )
})

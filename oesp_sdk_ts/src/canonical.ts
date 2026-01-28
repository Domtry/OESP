export function canonicalJsonBytes(obj: Record<string, unknown>, excludeKeys: string[] = []): Uint8Array {
  const exclude = new Set(excludeKeys)
  function removeKeys(v: unknown): unknown {
    if (Array.isArray(v)) return v.map(removeKeys)
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>
      const r: Record<string, unknown> = {}
      for (const k of Object.keys(o)) {
        if (!exclude.has(k)) r[k] = removeKeys(o[k])
      }
      return r
    }
    return v
  }
  const filtered = removeKeys(obj) as Record<string, unknown>
  const s = stableStringify(filtered)
  return new TextEncoder().encode(s)
}

function stableStringify(value: unknown): string {
  if (value === null) return "null"
  const t = typeof value
  if (t === "boolean") return value ? "true" : "false"
  if (t === "number") return String(value)
  if (t === "string") return JSON.stringify(value)
  if (value instanceof Uint8Array) return JSON.stringify(new TextDecoder().decode(value))
  if (Array.isArray(value)) return "[" + value.map(v => stableStringify(v)).join(",") + "]"
  if (t === "object") {
    const obj = value as Record<string, unknown>
    const keys = Object.keys(obj).sort()
    const parts = keys.map(k => JSON.stringify(k) + ":" + stableStringify(obj[k]))
    return "{" + parts.join(",") + "}"
  }
  return JSON.stringify(value)
}


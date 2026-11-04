export function extractImageUrls(text?: string, max = 8): string[] {
  if (!text) return []
  const urls = text.match(/https?:\/\/[^\s)\]]+/g) || []
  const imageLike = urls.filter((u) => {
    const low = u.toLowerCase()
    return (
      low.includes('figma.com') ||
      low.includes('/images/') ||
      /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(low) ||
      low.includes('s3.') ||
      low.includes('amazonaws') ||
      low.startsWith('data:image/')
    )
  })
  return [...new Set(imageLike)].slice(0, max)
}

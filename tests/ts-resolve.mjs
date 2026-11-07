/** Resolve extensionless relative imports the way Vite/tsc (bundler resolution) do. */
import { register } from 'node:module'

register(
  `data:text/javascript,${encodeURIComponent(`
  export async function resolve(specifier, context, next) {
    try {
      return await next(specifier, context)
    } catch (error) {
      if (specifier.startsWith('.') && !/\\.[a-z]+$/i.test(specifier)) {
        return next(specifier + '.ts', context)
      }
      throw error
    }
  }
  `)}`,
  import.meta.url,
)

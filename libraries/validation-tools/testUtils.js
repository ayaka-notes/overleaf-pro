function asZodError(...def) {
  return {
    name: 'ZodError',
    _zod: { def },
  }
}

module.exports = { asZodError }

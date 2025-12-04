export class ParserError extends Error {
  details?: any
  constructor(message: string, details?: any) {
    super(message)
    this.name = "ParserError"
    this.details = details
  }
}


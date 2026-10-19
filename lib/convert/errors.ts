import { AppError } from "@/lib/errors";

export class UnsupportedFileError extends AppError {
  constructor(message = "Unsupported file type. Use .txt, .md or .docx.") {
    super(415, "UNSUPPORTED_FILE_TYPE", message);
    this.name = "UnsupportedFileError";
  }
}

export class CorruptFileError extends AppError {
  constructor(message = "This file couldn't be read. It may be damaged or not the type its name says.") {
    super(422, "CORRUPT_FILE", message);
    this.name = "CorruptFileError";
  }
}

export class FileTooLargeError extends AppError {
  constructor(message = "File too large (max 4 MB).") {
    super(413, "FILE_TOO_LARGE", message);
    this.name = "FileTooLargeError";
  }
}

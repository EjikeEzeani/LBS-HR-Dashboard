import { EventEmitter } from "events"

export type UploadEvent =
  | { type: "completed"; uploadId: string; summary: any }
  | { type: "failed"; uploadId: string; error: string }

class UploadEvents extends EventEmitter {
  emitCompleted(uploadId: string, summary: any) {
    this.emit("upload", { type: "completed", uploadId, summary } satisfies UploadEvent)
  }

  emitFailed(uploadId: string, error: string) {
    this.emit("upload", { type: "failed", uploadId, error } satisfies UploadEvent)
  }
}

export const uploadEvents = new UploadEvents()


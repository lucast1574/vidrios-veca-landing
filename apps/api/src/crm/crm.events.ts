import { Injectable } from "@nestjs/common";
import { Subject, interval, map, merge } from "rxjs";
@Injectable()
export class CrmEvents {
  private readonly changes = new Subject<{ data: { topic: string } }>();
  readonly stream = merge(
    this.changes,
    interval(20000).pipe(map(() => ({ data: { topic: "heartbeat" } }))),
  );
  emit(topic: string) {
    this.changes.next({ data: { topic } });
  }
}

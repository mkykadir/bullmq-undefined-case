import { BullMQWorker, bullmq } from "./bullmq/index.js";
import { tasks } from "./data/tasks.js";
import { onRepeat } from "./handlers/repeatable.js";
import { onTaskUpdate } from "./handlers/task-update.js";
import { onTimeInterval } from "./handlers/time-interval.js";

async function main() {
  bullmq.create(BullMQWorker.Queues.TaskUpdates(), onTaskUpdate);
  bullmq.create(BullMQWorker.Queues.Repeatable(), onRepeat);
  bullmq.create(BullMQWorker.Queues.TimeInterval(), onTimeInterval);

  await Promise.all([
    ...tasks.map((task) =>
      bullmq
        .getQueue(BullMQWorker.Queues.TimeInterval())
        .add(task.taskId, task, { delay: 1_000 })
    ),
    bullmq.getQueue(BullMQWorker.Queues.Repeatable()).add(
      "health",
      {},
      {
        delay: 1_000,
        repeat: {
          every: 1_000,
        },
      }
    ),
  ]);
}

main();

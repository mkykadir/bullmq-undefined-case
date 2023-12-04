import { BullMQWorker, bullmq } from "../bullmq/index.js";
import { tasks } from "../data/tasks.js";

export const onRepeat = async () => {
  console.info("Health check is running");

  const [taskUpdates, timeIntervals] = await Promise.all([
    bullmq
      .getQueue(BullMQWorker.Queues.TimeInterval())
      .getJobs(["active", "delayed", "prioritized", "waiting", "wait"]),
    bullmq
      .getQueue(BullMQWorker.Queues.TaskUpdates())
      .getJobs(["active", "delayed", "prioritized", "waiting", "wait"]),
  ]);

  const allTasks = [...taskUpdates, ...timeIntervals];

  // console.log(`${JSON.stringify(allTasks)}`);

  tasks.map((task) => {
    const taskFound = allTasks.find((job) => {
      if (job) {
        return task.taskId === job.name;
      } else {
        console.error(`Task name undefined for ${task.taskId}`);
        return false;
      }
    });

    if (!taskFound) {
      console.error(`Task could not be found anywhere ${task.taskId}`);
    }
  });

  console.info(`Health check completed for ${allTasks.length}`);
};

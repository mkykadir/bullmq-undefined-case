export interface TaskData {
  taskId: string;
  waitInMs?: number;
}

export const tasks: TaskData[] = [
  {
    taskId: "1",
    waitInMs: 990,
  },
  {
    taskId: "2",
    waitInMs: 200,
  },
  {
    taskId: "3",
  },
  {
    taskId: "4",
    waitInMs: 500,
  },
];

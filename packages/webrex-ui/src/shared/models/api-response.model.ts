export type ApiResponse<T> = {
  result: {
    id: string;
    value: T;
    versionStamp: string;
  }[];
};

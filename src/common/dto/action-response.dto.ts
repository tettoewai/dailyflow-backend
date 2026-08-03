export interface ActionResponse<T = void> {
  message: string;
  success: boolean;
  data?: T;
}

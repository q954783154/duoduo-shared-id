export interface Account {
  id: string;
  source?: string;
  country?: string;
  username: string;
  password: string;
  status?: number;
  statusText?: string;
  status_text?: string;
  time?: string;
  msg?: string;
  updateTime: string;
  isAvailable: boolean;
}

export interface PromoLink {
  id: string;
  title: string;
  description: string;
  url: string;
  gradient?: string;
}

export interface LoadingState {
  progress: number;
  isComplete: boolean;
}

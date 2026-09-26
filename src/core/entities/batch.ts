

export enum BatchType {
    Index = "index",
    Redact = "redact",
}

export enum BatchStatus {
    None = "none",
    Pending = "pending",
    Finalized = "finalized",
}

export enum TaskStatus {
    // queued   ->  not submitted 
    // sent  -> submitted but not yet registered 
    // pending  -> submitted and registered 
    // ==============================
    // rejected -> cant send or register
    // deferred ->   callback wait time outed 
    // failed  -> callback retuned an error 
    // success  -> callback returned success 

    Queued = "queued",
    Sent = "sent",
    Pending = "pending",
    Rejected = "rejected",
    Deferred = "deferred",
    Success = "success",
    Failed = "failed",
}


export interface BatchSource {
    name: string;
    items: string[];
}

export interface Batch {
    detail: BatchDetail;
    status: BatchStatus;
    items: Task[];
}

export interface BatchDetail {
    name: string;
    type: BatchType;
}

export interface BatchReportItem {
    status: string;
    count: number;
}

export interface BatchReport {
    batch: BatchDetail;
    items: BatchReportItem[];
}

export interface Task {
    id: string;
    name: string;
    batch: BatchDetail;
    status: TaskStatus;
    sessionId: string | null;
}


export interface TaskResult {
    task: Task;
    errorMessage: string | null;
}


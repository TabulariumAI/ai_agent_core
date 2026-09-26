import { Container } from "../../di/container";
import { TOKENS } from "../../core/tokens";
import { TaskProcessor } from "./taskProcessor";

export function getIndexProcessor(): TaskProcessor {
    return Container.get<TaskProcessor>(TOKENS.IndexTaskProcessor);
}

export function getRedactProcessor(): TaskProcessor {
    return Container.get<TaskProcessor>(TOKENS.RedactTaskProcessor);
}

export function startIndexProcessor(): Promise<void> {
    return getIndexProcessor().processTasks(
    );
}

export function startRedactProcessor(): Promise<void> {
    return getRedactProcessor().processTasks(
    );
}

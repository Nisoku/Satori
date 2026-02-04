export interface CallsiteInfo {
    file: string;
    line: number;
    column: number;
    function?: string;
}
export declare function extractCallsite(depth?: number): string | undefined;

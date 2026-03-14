type QueryResult<T = unknown> = {
    data?: T;
    error?: unknown;
};

function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
    return Boolean(value) && typeof (value as PromiseLike<T>).then === "function";
}

async function resolveQueryResult<T>(value: unknown): Promise<QueryResult<T>> {
    if (value === undefined || value === null) {
        return {};
    }

    if (isPromiseLike<QueryResult<T>>(value)) {
        return (await value) ?? {};
    }

    return value as QueryResult<T>;
}

export async function resolveSingleQuery<T>(
    query: { maybeSingle?: () => unknown; single?: () => unknown } | null | undefined
): Promise<QueryResult<T>> {
    if (!query) {
        return {};
    }

    if (typeof query.maybeSingle === "function") {
        const result = await resolveQueryResult<T>(query.maybeSingle());
        if (Object.keys(result).length > 0) {
            return result;
        }
    }

    if (typeof query.single === "function") {
        return resolveQueryResult<T>(query.single());
    }

    return resolveQueryResult<T>(query);
}

export async function resolveQuery<T>(query: unknown): Promise<QueryResult<T>> {
    return resolveQueryResult<T>(query);
}

export async function resolveEqMutation<T>(
    query: { eq?: (column: string, value: unknown) => unknown } | null | undefined,
    column: string,
    value: unknown
): Promise<QueryResult<T>> {
    if (!query) {
        return {};
    }

    if (typeof query.eq === "function") {
        return resolveQueryResult<T>(query.eq(column, value));
    }

    return resolveQueryResult<T>(query);
}

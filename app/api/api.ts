import {createApi, fetchBaseQuery, retry} from "@reduxjs/toolkit/query";

const baseQuery = fetchBaseQuery({
    baseUrl: 'http://10.0.2.2:5263',
    mode: 'cors',
    prepareHeaders: (headers) => {
        return headers
    }
});
const baseQueryWithRetry = retry(baseQuery, {maxRetries: 3});

export const api = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithRetry,
    tagTypes: ['Auth',],
    endpoints: () => ({}),
});
import {api} from "@/app/api/api";
import {BaseQueryArg} from "@reduxjs/toolkit/query";

export const AuthApi = api.injectEndpoints({
   endpoints: (builder) => ({
     login: builder.mutation<any, any>({
        query: (userCredentials) => ({
            url: '/connect/token',
            method: 'POST',
            body: userCredentials, //[...userCredentials, 'grant_type : password']
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        }),
         invalidatesTags: ['Auth'],
     }),
   })
});

export const {useLoginMutation} = AuthApi;
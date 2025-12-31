import api, { FIREBASE_CONFIG } from './axios';

export const extractVal = (field: any) => {
    if (!field) return field === false ? false : '';
    if (field.stringValue !== undefined) return field.stringValue;
    if (field.booleanValue !== undefined) return field.booleanValue;
    if (field.integerValue !== undefined) return parseInt(field.integerValue);
    if (field.doubleValue !== undefined) return parseFloat(field.doubleValue);
    if (field.timestampValue !== undefined) return field.timestampValue;
    if (field.arrayValue !== undefined) return field.arrayValue.values?.map((v: any) => extractVal(v)) || [];
    return '';
};

export const toFirestoreValue = (val: any): any => {
    if (typeof val === 'string') return { stringValue: val };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (typeof val === 'number') {
        if (Number.isInteger(val)) return { integerValue: val.toString() };
        return { doubleValue: val };
    }
    if (Array.isArray(val)) return { arrayValue: { values: val.map(v => toFirestoreValue(v)) } };
    return { stringValue: val?.toString() || '' };
};

export const firestoreRest = {
    get: async (collection: string, id: string, idToken?: string) => {
        const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/${collection}/${id}?key=${FIREBASE_CONFIG.apiKey}`;
        const headers: any = {};
        if (idToken) headers.Authorization = `Bearer ${idToken}`;
        const response = await api.get(url, { headers });
        return response.data;
    },

    list: async (collection: string, options: { orderBy?: string, limit?: number } = {}, idToken?: string) => {
        // Basic list doesn't support complex queries as easily as structuredQuery,
        // but for simple lists we can use the documents endpoint.
        let url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/${collection}?key=${FIREBASE_CONFIG.apiKey}`;
        if (options.orderBy) url += `&orderBy=${options.orderBy}`;
        if (options.limit) url += `&pageSize=${options.limit}`;

        const headers: any = {};
        if (idToken) headers.Authorization = `Bearer ${idToken}`;

        const response = await api.get(url, { headers });
        return response.data.documents || [];
    },

    create: async (collection: string, data: any, idToken?: string) => {
        const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/${collection}?key=${FIREBASE_CONFIG.apiKey}`;
        const headers: any = {};
        if (idToken) headers.Authorization = `Bearer ${idToken}`;

        const fields: any = {};
        Object.keys(data).forEach(key => {
            fields[key] = toFirestoreValue(data[key]);
        });

        const response = await api.post(url, { fields }, { headers });
        return response.data;
    },

    patch: async (collection: string, id: string, data: any, idToken?: string) => {
        const fieldPaths = Object.keys(data).map(k => `updateMask.fieldPaths=${k}`).join('&');
        const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/${collection}/${id}?key=${FIREBASE_CONFIG.apiKey}&${fieldPaths}`;

        const fields: any = {};
        Object.keys(data).forEach(key => {
            fields[key] = toFirestoreValue(data[key]);
        });

        const headers: any = {};
        if (idToken) headers.Authorization = `Bearer ${idToken}`;

        const response = await api.patch(url, { fields }, { headers });
        return response.data;
    },

    query: async (collection: string, options: {
        where?: { field: string, op: string, value: any }[],
        orderBy?: { field: string, direction: 'ASCENDING' | 'DESCENDING' }[],
        limit?: number
    }, idToken?: string) => {
        const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents:runQuery?key=${FIREBASE_CONFIG.apiKey}`;

        const structuredQuery: any = {
            from: [{ collectionId: collection }]
        };

        if (options.where && options.where.length > 0) {
            const filters = options.where.map(f => ({
                fieldFilter: {
                    field: { fieldPath: f.field },
                    op: f.op,
                    value: toFirestoreValue(f.value)
                }
            }));
            structuredQuery.where = filters.length === 1 ? filters[0] : { compositeFilter: { op: 'AND', filters } };
        }

        if (options.orderBy && options.orderBy.length > 0) {
            structuredQuery.orderBy = options.orderBy.map(o => ({
                field: { fieldPath: o.field },
                direction: o.direction
            }));
        }

        if (options.limit) {
            structuredQuery.limit = options.limit;
        }

        const headers: any = {};
        if (idToken) headers.Authorization = `Bearer ${idToken}`;

        const response = await api.post(url, { structuredQuery }, { headers });
        // runQuery returns an array of [{ document: { name, fields, ... } }]
        // Important: runQuery can return an empty result as [ { readTime: ... } ]
        return (response.data || []).map((item: any) => item.document).filter((doc: any) => !!doc);
    },

    delete: async (collection: string, id: string, idToken?: string) => {
        const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/${collection}/${id}?key=${FIREBASE_CONFIG.apiKey}`;
        const headers: any = {};
        if (idToken) headers.Authorization = `Bearer ${idToken}`;
        const response = await api.delete(url, { headers });
        return response.data;
    }
};

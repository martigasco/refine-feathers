import { AxiosInstance } from "axios";
import querystring from "query-string";
import { DataProvider } from "@refinedev/core";
import { axiosInstance, feathersInstance, generateSort, generateFilter } from "./utils";

type MethodTypes = "get" | "delete" | "head" | "options";
type MethodTypesWithBody = "post" | "put" | "patch";

const stringify = querystring.stringify;

export const dataProvider = (
  apiUrl: string,
  feathers: any = feathersInstance(apiUrl),
): Omit<
  Required<DataProvider>,
  "createMany" | "updateMany" | "deleteMany"
> => ({
  getList: async ({ resource, pagination, filters, sorters, meta }) => {
    const url = `${apiUrl}/${resource}`;

    const { current = 1, pageSize = 10, mode = "server" } = pagination ?? {};

    const { headers: headersFromMeta, method, pipeline } = meta ?? {};
    const requestMethod = (method as MethodTypes) ?? "get";

    const queryFilters = generateFilter(filters);

    console.log('[F_PROVIDER] Query filters', queryFilters)
    console.log('[F_PROVIDER] Headers from meta', headersFromMeta)

    const query: {
      $limit?: number;
      $skip?: number;
      $sort?: Object;
    } = {};

    if (mode === "server") {
      query.$limit = pageSize;
      query.$skip = (current - 1) * pageSize;
    }

    // TODO: WTF IS THIS
    const generatedSort = generateSort(sorters);
    if (generatedSort) {
      const { _sort, _order } = generatedSort;
      const sorters: any = {};
      _sort.map((s:string,i) => {
        sorters[s] = _order[i] == 'desc' ? -1 : 1;
      })
      query.$sort = sorters;
      //query._order = _order.join(",");
    }

    // OLD METHOD START

    // const combinedQuery = { ...query, ...queryFilters, $pipeline: pipeline };
    // const urlWithQuery = Object.keys(combinedQuery).length
    //   ? `${url}?${stringify(combinedQuery)}`
    //   : url;

    // const { data: response, headers } = await httpClient[requestMethod](urlWithQuery, {
    //   headers: headersFromMeta,
    // });

    // const { total, limit, skip, data } = response;

    // OLD METHOD END

    // NEW CLIENT START

    console.log('[F_PROVIDER] Pipeline', pipeline)
    console.log('[F_PROVIDER] Filters', query)

    const { total, limit, skip, data } = await feathers.service(resource).find({
      query: {...query, ...queryFilters, pipeline},
      pipeline
    })

    console.log('[F_PROVIDER] List data', data)

    // NEW CLIENT END

    return {
      data: data.map((i: any) => ({ ...i, id: i._id })),
      total: total || data.length,
    };
  },

  getMany: async ({ resource, ids, meta }) => {
    const { headers, method } = meta ?? {};
    const requestMethod = (method as MethodTypes) ?? "get";

    const { data } = await feathers.service(resource).find({
      query: { _id: ids },
      paginate: false
    })

    // const { data } = await httpClient[requestMethod](
    //   `${apiUrl}/${resource}?${stringify({ _id: ids })}`,
    //   { headers },
    // );

    return {
      data: data.map((i: any) => ({ ...i, id: i._id })),
    };
  },

  create: async ({ resource, variables, meta }) => {
    const url = `${apiUrl}/${resource}`;

    const { headers, method } = meta ?? {};
    const requestMethod = (method as MethodTypesWithBody) ?? "post";

    console.log('[F_PROVIDER] Create variables', variables)
    console.log('[F_PROVIDER] Create meta', meta)

    const data = await feathers.service(resource).create(variables)

    // const { data } = await httpClient[requestMethod](url, variables, {
    //   headers,
    // });

    return {
      data: { ...data, id: data._id },
    };
  },

  update: async ({ resource, id, variables, meta }) => {
    //alert("update")
    const url = `${apiUrl}/${resource}/${id}`;

    const { headers, method } = meta ?? {};
    const requestMethod = (method as MethodTypesWithBody) ?? "patch";

    console.log("Patch ID", id)
    console.log("Patch variables", variables)
    console.log("Patch metas", meta)

    const data = meta?.patchQuery ? await feathers.service(resource).patch(id, variables, { query: meta.patchQuery }) : await feathers.service(resource).patch(id, variables);

    // const { data } = await httpClient[requestMethod](url, variables, {
    //   headers,
    // });

    return {
      data: { ...data, id: data._id },
    };
  },

  getOne: async ({ resource, id, meta }) => {
    const url = `${apiUrl}/${resource}/${id}`;

    const { headers, method } = meta ?? {};
    const requestMethod = (method as MethodTypes) ?? "get";

    const data = await feathers.service(resource).get(id);

    // const { data } = await httpClient[requestMethod](url, { headers });

    return {
      data: { ...data, id: data._id },
    };
  },

  deleteOne: async ({ resource, id, variables, meta }) => {
    const url = `${apiUrl}/${resource}/${id}`;

    const { headers, method } = meta ?? {};
    const requestMethod = (method as MethodTypesWithBody) ?? "delete";

    const data = await feathers.service(resource).remove(id);


    // const { data } = await httpClient[requestMethod](url, {
    //   data: variables,
    //   headers,
    // });

    return {
      data: { ...data, id: data._id },
    };
  },

  getApiUrl: () => {
    return apiUrl;
  },

  custom: async ({
    url,
    method,
    filters,
    sorters,
    payload,
    query,
    headers,
  }) => {
    let requestUrl = `${url}?`;

    if (sorters) {
      const generatedSort = generateSort(sorters);
      if (generatedSort) {
        const { _sort, _order } = generatedSort;
        const sortQuery = {
          _sort: _sort.join(","),
          _order: _order.join(","),
        };
        requestUrl = `${requestUrl}&${stringify(sortQuery)}`;
      }
    }

    if (filters) {
      const filterQuery = generateFilter(filters);
      requestUrl = `${requestUrl}&${stringify(filterQuery)}`;
    }

    if (query) {
      requestUrl = `${requestUrl}&${stringify(query)}`;
    }

    //PATCH
    return Promise.reject();

    // let axiosResponse;
    // switch (method) {
    //   case "put":
    //   case "post":
    //   case "patch":
    //     axiosResponse = await httpClient[method](url, payload, {
    //       headers,
    //     });
    //     break;
    //   case "delete":
    //     axiosResponse = await httpClient.delete(url, {
    //       data: payload,
    //       headers: headers,
    //     });
    //     break;
    //   default:
    //     axiosResponse = await httpClient.get(requestUrl, {
    //       headers,
    //     });
    //     break;
    // }

    // const { data } = axiosResponse;

    // return Promise.resolve({ data });
  },
});

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/@supabase/node-fetch/browser.js
var browser_exports = {};
__export(browser_exports, {
  Headers: () => Headers2,
  Request: () => Request2,
  Response: () => Response2,
  default: () => browser_default,
  fetch: () => fetch2
});
var getGlobal, globalObject, fetch2, browser_default, Headers2, Request2, Response2;
var init_browser = __esm({
  "node_modules/@supabase/node-fetch/browser.js"() {
    "use strict";
    getGlobal = function() {
      if (typeof self !== "undefined") {
        return self;
      }
      if (typeof window !== "undefined") {
        return window;
      }
      if (typeof global !== "undefined") {
        return global;
      }
      throw new Error("unable to locate global object");
    };
    globalObject = getGlobal();
    fetch2 = globalObject.fetch;
    browser_default = globalObject.fetch.bind(globalObject);
    Headers2 = globalObject.Headers;
    Request2 = globalObject.Request;
    Response2 = globalObject.Response;
  }
});

// node_modules/@supabase/postgrest-js/dist/cjs/PostgrestError.js
var require_PostgrestError = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/cjs/PostgrestError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PostgrestError2 = class extends Error {
      constructor(context) {
        super(context.message);
        this.name = "PostgrestError";
        this.details = context.details;
        this.hint = context.hint;
        this.code = context.code;
      }
    };
    exports.default = PostgrestError2;
  }
});

// node_modules/@supabase/postgrest-js/dist/cjs/PostgrestBuilder.js
var require_PostgrestBuilder = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/cjs/PostgrestBuilder.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var node_fetch_1 = __importDefault((init_browser(), __toCommonJS(browser_exports)));
    var PostgrestError_1 = __importDefault(require_PostgrestError());
    var PostgrestBuilder2 = class {
      constructor(builder) {
        var _a, _b;
        this.shouldThrowOnError = false;
        this.method = builder.method;
        this.url = builder.url;
        this.headers = new Headers(builder.headers);
        this.schema = builder.schema;
        this.body = builder.body;
        this.shouldThrowOnError = (_a = builder.shouldThrowOnError) !== null && _a !== void 0 ? _a : false;
        this.signal = builder.signal;
        this.isMaybeSingle = (_b = builder.isMaybeSingle) !== null && _b !== void 0 ? _b : false;
        if (builder.fetch) {
          this.fetch = builder.fetch;
        } else if (typeof fetch === "undefined") {
          this.fetch = node_fetch_1.default;
        } else {
          this.fetch = fetch;
        }
      }
      /**
       * If there's an error with the query, throwOnError will reject the promise by
       * throwing the error instead of returning it as part of a successful response.
       *
       * {@link https://github.com/supabase/supabase-js/issues/92}
       */
      throwOnError() {
        this.shouldThrowOnError = true;
        return this;
      }
      /**
       * Set an HTTP header for the request.
       */
      setHeader(name, value2) {
        this.headers = new Headers(this.headers);
        this.headers.set(name, value2);
        return this;
      }
      then(onfulfilled, onrejected) {
        if (this.schema === void 0) {
        } else if (["GET", "HEAD"].includes(this.method)) {
          this.headers.set("Accept-Profile", this.schema);
        } else {
          this.headers.set("Content-Profile", this.schema);
        }
        if (this.method !== "GET" && this.method !== "HEAD") {
          this.headers.set("Content-Type", "application/json");
        }
        const _fetch = this.fetch;
        let res = _fetch(this.url.toString(), {
          method: this.method,
          headers: this.headers,
          body: JSON.stringify(this.body),
          signal: this.signal
        }).then(async (res2) => {
          var _a, _b, _c, _d;
          let error = null;
          let data = null;
          let count = null;
          let status = res2.status;
          let statusText = res2.statusText;
          if (res2.ok) {
            if (this.method !== "HEAD") {
              const body = await res2.text();
              if (body === "") {
              } else if (this.headers.get("Accept") === "text/csv") {
                data = body;
              } else if (this.headers.get("Accept") && ((_a = this.headers.get("Accept")) === null || _a === void 0 ? void 0 : _a.includes("application/vnd.pgrst.plan+text"))) {
                data = body;
              } else {
                data = JSON.parse(body);
              }
            }
            const countHeader = (_b = this.headers.get("Prefer")) === null || _b === void 0 ? void 0 : _b.match(/count=(exact|planned|estimated)/);
            const contentRange = (_c = res2.headers.get("content-range")) === null || _c === void 0 ? void 0 : _c.split("/");
            if (countHeader && contentRange && contentRange.length > 1) {
              count = parseInt(contentRange[1]);
            }
            if (this.isMaybeSingle && this.method === "GET" && Array.isArray(data)) {
              if (data.length > 1) {
                error = {
                  // https://github.com/PostgREST/postgrest/blob/a867d79c42419af16c18c3fb019eba8df992626f/src/PostgREST/Error.hs#L553
                  code: "PGRST116",
                  details: `Results contain ${data.length} rows, application/vnd.pgrst.object+json requires 1 row`,
                  hint: null,
                  message: "JSON object requested, multiple (or no) rows returned"
                };
                data = null;
                count = null;
                status = 406;
                statusText = "Not Acceptable";
              } else if (data.length === 1) {
                data = data[0];
              } else {
                data = null;
              }
            }
          } else {
            const body = await res2.text();
            try {
              error = JSON.parse(body);
              if (Array.isArray(error) && res2.status === 404) {
                data = [];
                error = null;
                status = 200;
                statusText = "OK";
              }
            } catch (_e) {
              if (res2.status === 404 && body === "") {
                status = 204;
                statusText = "No Content";
              } else {
                error = {
                  message: body
                };
              }
            }
            if (error && this.isMaybeSingle && ((_d = error === null || error === void 0 ? void 0 : error.details) === null || _d === void 0 ? void 0 : _d.includes("0 rows"))) {
              error = null;
              status = 200;
              statusText = "OK";
            }
            if (error && this.shouldThrowOnError) {
              throw new PostgrestError_1.default(error);
            }
          }
          const postgrestResponse = {
            error,
            data,
            count,
            status,
            statusText
          };
          return postgrestResponse;
        });
        if (!this.shouldThrowOnError) {
          res = res.catch((fetchError) => {
            var _a, _b, _c;
            return {
              error: {
                message: `${(_a = fetchError === null || fetchError === void 0 ? void 0 : fetchError.name) !== null && _a !== void 0 ? _a : "FetchError"}: ${fetchError === null || fetchError === void 0 ? void 0 : fetchError.message}`,
                details: `${(_b = fetchError === null || fetchError === void 0 ? void 0 : fetchError.stack) !== null && _b !== void 0 ? _b : ""}`,
                hint: "",
                code: `${(_c = fetchError === null || fetchError === void 0 ? void 0 : fetchError.code) !== null && _c !== void 0 ? _c : ""}`
              },
              data: null,
              count: null,
              status: 0,
              statusText: ""
            };
          });
        }
        return res.then(onfulfilled, onrejected);
      }
      /**
       * Override the type of the returned `data`.
       *
       * @typeParam NewResult - The new result type to override with
       * @deprecated Use overrideTypes<yourType, { merge: false }>() method at the end of your call chain instead
       */
      returns() {
        return this;
      }
      /**
       * Override the type of the returned `data` field in the response.
       *
       * @typeParam NewResult - The new type to cast the response data to
       * @typeParam Options - Optional type configuration (defaults to { merge: true })
       * @typeParam Options.merge - When true, merges the new type with existing return type. When false, replaces the existing types entirely (defaults to true)
       * @example
       * ```typescript
       * // Merge with existing types (default behavior)
       * const query = supabase
       *   .from('users')
       *   .select()
       *   .overrideTypes<{ custom_field: string }>()
       *
       * // Replace existing types completely
       * const replaceQuery = supabase
       *   .from('users')
       *   .select()
       *   .overrideTypes<{ id: number; name: string }, { merge: false }>()
       * ```
       * @returns A PostgrestBuilder instance with the new type
       */
      overrideTypes() {
        return this;
      }
    };
    exports.default = PostgrestBuilder2;
  }
});

// node_modules/@supabase/postgrest-js/dist/cjs/PostgrestTransformBuilder.js
var require_PostgrestTransformBuilder = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/cjs/PostgrestTransformBuilder.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var PostgrestBuilder_1 = __importDefault(require_PostgrestBuilder());
    var PostgrestTransformBuilder2 = class extends PostgrestBuilder_1.default {
      /**
       * Perform a SELECT on the query result.
       *
       * By default, `.insert()`, `.update()`, `.upsert()`, and `.delete()` do not
       * return modified rows. By calling this method, modified rows are returned in
       * `data`.
       *
       * @param columns - The columns to retrieve, separated by commas
       */
      select(columns) {
        let quoted = false;
        const cleanedColumns = (columns !== null && columns !== void 0 ? columns : "*").split("").map((c) => {
          if (/\s/.test(c) && !quoted) {
            return "";
          }
          if (c === '"') {
            quoted = !quoted;
          }
          return c;
        }).join("");
        this.url.searchParams.set("select", cleanedColumns);
        this.headers.append("Prefer", "return=representation");
        return this;
      }
      /**
       * Order the query result by `column`.
       *
       * You can call this method multiple times to order by multiple columns.
       *
       * You can order referenced tables, but it only affects the ordering of the
       * parent table if you use `!inner` in the query.
       *
       * @param column - The column to order by
       * @param options - Named parameters
       * @param options.ascending - If `true`, the result will be in ascending order
       * @param options.nullsFirst - If `true`, `null`s appear first. If `false`,
       * `null`s appear last.
       * @param options.referencedTable - Set this to order a referenced table by
       * its columns
       * @param options.foreignTable - Deprecated, use `options.referencedTable`
       * instead
       */
      order(column, { ascending = true, nullsFirst, foreignTable, referencedTable = foreignTable } = {}) {
        const key = referencedTable ? `${referencedTable}.order` : "order";
        const existingOrder = this.url.searchParams.get(key);
        this.url.searchParams.set(key, `${existingOrder ? `${existingOrder},` : ""}${column}.${ascending ? "asc" : "desc"}${nullsFirst === void 0 ? "" : nullsFirst ? ".nullsfirst" : ".nullslast"}`);
        return this;
      }
      /**
       * Limit the query result by `count`.
       *
       * @param count - The maximum number of rows to return
       * @param options - Named parameters
       * @param options.referencedTable - Set this to limit rows of referenced
       * tables instead of the parent table
       * @param options.foreignTable - Deprecated, use `options.referencedTable`
       * instead
       */
      limit(count, { foreignTable, referencedTable = foreignTable } = {}) {
        const key = typeof referencedTable === "undefined" ? "limit" : `${referencedTable}.limit`;
        this.url.searchParams.set(key, `${count}`);
        return this;
      }
      /**
       * Limit the query result by starting at an offset `from` and ending at the offset `to`.
       * Only records within this range are returned.
       * This respects the query order and if there is no order clause the range could behave unexpectedly.
       * The `from` and `to` values are 0-based and inclusive: `range(1, 3)` will include the second, third
       * and fourth rows of the query.
       *
       * @param from - The starting index from which to limit the result
       * @param to - The last index to which to limit the result
       * @param options - Named parameters
       * @param options.referencedTable - Set this to limit rows of referenced
       * tables instead of the parent table
       * @param options.foreignTable - Deprecated, use `options.referencedTable`
       * instead
       */
      range(from, to, { foreignTable, referencedTable = foreignTable } = {}) {
        const keyOffset = typeof referencedTable === "undefined" ? "offset" : `${referencedTable}.offset`;
        const keyLimit = typeof referencedTable === "undefined" ? "limit" : `${referencedTable}.limit`;
        this.url.searchParams.set(keyOffset, `${from}`);
        this.url.searchParams.set(keyLimit, `${to - from + 1}`);
        return this;
      }
      /**
       * Set the AbortSignal for the fetch request.
       *
       * @param signal - The AbortSignal to use for the fetch request
       */
      abortSignal(signal) {
        this.signal = signal;
        return this;
      }
      /**
       * Return `data` as a single object instead of an array of objects.
       *
       * Query result must be one row (e.g. using `.limit(1)`), otherwise this
       * returns an error.
       */
      single() {
        this.headers.set("Accept", "application/vnd.pgrst.object+json");
        return this;
      }
      /**
       * Return `data` as a single object instead of an array of objects.
       *
       * Query result must be zero or one row (e.g. using `.limit(1)`), otherwise
       * this returns an error.
       */
      maybeSingle() {
        if (this.method === "GET") {
          this.headers.set("Accept", "application/json");
        } else {
          this.headers.set("Accept", "application/vnd.pgrst.object+json");
        }
        this.isMaybeSingle = true;
        return this;
      }
      /**
       * Return `data` as a string in CSV format.
       */
      csv() {
        this.headers.set("Accept", "text/csv");
        return this;
      }
      /**
       * Return `data` as an object in [GeoJSON](https://geojson.org) format.
       */
      geojson() {
        this.headers.set("Accept", "application/geo+json");
        return this;
      }
      /**
       * Return `data` as the EXPLAIN plan for the query.
       *
       * You need to enable the
       * [db_plan_enabled](https://supabase.com/docs/guides/database/debugging-performance#enabling-explain)
       * setting before using this method.
       *
       * @param options - Named parameters
       *
       * @param options.analyze - If `true`, the query will be executed and the
       * actual run time will be returned
       *
       * @param options.verbose - If `true`, the query identifier will be returned
       * and `data` will include the output columns of the query
       *
       * @param options.settings - If `true`, include information on configuration
       * parameters that affect query planning
       *
       * @param options.buffers - If `true`, include information on buffer usage
       *
       * @param options.wal - If `true`, include information on WAL record generation
       *
       * @param options.format - The format of the output, can be `"text"` (default)
       * or `"json"`
       */
      explain({ analyze = false, verbose = false, settings = false, buffers = false, wal = false, format = "text" } = {}) {
        var _a;
        const options = [
          analyze ? "analyze" : null,
          verbose ? "verbose" : null,
          settings ? "settings" : null,
          buffers ? "buffers" : null,
          wal ? "wal" : null
        ].filter(Boolean).join("|");
        const forMediatype = (_a = this.headers.get("Accept")) !== null && _a !== void 0 ? _a : "application/json";
        this.headers.set("Accept", `application/vnd.pgrst.plan+${format}; for="${forMediatype}"; options=${options};`);
        if (format === "json") {
          return this;
        } else {
          return this;
        }
      }
      /**
       * Rollback the query.
       *
       * `data` will still be returned, but the query is not committed.
       */
      rollback() {
        this.headers.append("Prefer", "tx=rollback");
        return this;
      }
      /**
       * Override the type of the returned `data`.
       *
       * @typeParam NewResult - The new result type to override with
       * @deprecated Use overrideTypes<yourType, { merge: false }>() method at the end of your call chain instead
       */
      returns() {
        return this;
      }
      /**
       * Set the maximum number of rows that can be affected by the query.
       * Only available in PostgREST v13+ and only works with PATCH and DELETE methods.
       *
       * @param value - The maximum number of rows that can be affected
       */
      maxAffected(value2) {
        this.headers.append("Prefer", "handling=strict");
        this.headers.append("Prefer", `max-affected=${value2}`);
        return this;
      }
    };
    exports.default = PostgrestTransformBuilder2;
  }
});

// node_modules/@supabase/postgrest-js/dist/cjs/PostgrestFilterBuilder.js
var require_PostgrestFilterBuilder = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/cjs/PostgrestFilterBuilder.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var PostgrestTransformBuilder_1 = __importDefault(require_PostgrestTransformBuilder());
    var PostgrestFilterBuilder2 = class extends PostgrestTransformBuilder_1.default {
      /**
       * Match only rows where `column` is equal to `value`.
       *
       * To check if the value of `column` is NULL, you should use `.is()` instead.
       *
       * @param column - The column to filter on
       * @param value - The value to filter with
       */
      eq(column, value2) {
        this.url.searchParams.append(column, `eq.${value2}`);
        return this;
      }
      /**
       * Match only rows where `column` is not equal to `value`.
       *
       * @param column - The column to filter on
       * @param value - The value to filter with
       */
      neq(column, value2) {
        this.url.searchParams.append(column, `neq.${value2}`);
        return this;
      }
      /**
       * Match only rows where `column` is greater than `value`.
       *
       * @param column - The column to filter on
       * @param value - The value to filter with
       */
      gt(column, value2) {
        this.url.searchParams.append(column, `gt.${value2}`);
        return this;
      }
      /**
       * Match only rows where `column` is greater than or equal to `value`.
       *
       * @param column - The column to filter on
       * @param value - The value to filter with
       */
      gte(column, value2) {
        this.url.searchParams.append(column, `gte.${value2}`);
        return this;
      }
      /**
       * Match only rows where `column` is less than `value`.
       *
       * @param column - The column to filter on
       * @param value - The value to filter with
       */
      lt(column, value2) {
        this.url.searchParams.append(column, `lt.${value2}`);
        return this;
      }
      /**
       * Match only rows where `column` is less than or equal to `value`.
       *
       * @param column - The column to filter on
       * @param value - The value to filter with
       */
      lte(column, value2) {
        this.url.searchParams.append(column, `lte.${value2}`);
        return this;
      }
      /**
       * Match only rows where `column` matches `pattern` case-sensitively.
       *
       * @param column - The column to filter on
       * @param pattern - The pattern to match with
       */
      like(column, pattern) {
        this.url.searchParams.append(column, `like.${pattern}`);
        return this;
      }
      /**
       * Match only rows where `column` matches all of `patterns` case-sensitively.
       *
       * @param column - The column to filter on
       * @param patterns - The patterns to match with
       */
      likeAllOf(column, patterns) {
        this.url.searchParams.append(column, `like(all).{${patterns.join(",")}}`);
        return this;
      }
      /**
       * Match only rows where `column` matches any of `patterns` case-sensitively.
       *
       * @param column - The column to filter on
       * @param patterns - The patterns to match with
       */
      likeAnyOf(column, patterns) {
        this.url.searchParams.append(column, `like(any).{${patterns.join(",")}}`);
        return this;
      }
      /**
       * Match only rows where `column` matches `pattern` case-insensitively.
       *
       * @param column - The column to filter on
       * @param pattern - The pattern to match with
       */
      ilike(column, pattern) {
        this.url.searchParams.append(column, `ilike.${pattern}`);
        return this;
      }
      /**
       * Match only rows where `column` matches all of `patterns` case-insensitively.
       *
       * @param column - The column to filter on
       * @param patterns - The patterns to match with
       */
      ilikeAllOf(column, patterns) {
        this.url.searchParams.append(column, `ilike(all).{${patterns.join(",")}}`);
        return this;
      }
      /**
       * Match only rows where `column` matches any of `patterns` case-insensitively.
       *
       * @param column - The column to filter on
       * @param patterns - The patterns to match with
       */
      ilikeAnyOf(column, patterns) {
        this.url.searchParams.append(column, `ilike(any).{${patterns.join(",")}}`);
        return this;
      }
      /**
       * Match only rows where `column` IS `value`.
       *
       * For non-boolean columns, this is only relevant for checking if the value of
       * `column` is NULL by setting `value` to `null`.
       *
       * For boolean columns, you can also set `value` to `true` or `false` and it
       * will behave the same way as `.eq()`.
       *
       * @param column - The column to filter on
       * @param value - The value to filter with
       */
      is(column, value2) {
        this.url.searchParams.append(column, `is.${value2}`);
        return this;
      }
      /**
       * Match only rows where `column` is included in the `values` array.
       *
       * @param column - The column to filter on
       * @param values - The values array to filter with
       */
      in(column, values) {
        const cleanedValues = Array.from(new Set(values)).map((s) => {
          if (typeof s === "string" && new RegExp("[,()]").test(s))
            return `"${s}"`;
          else
            return `${s}`;
        }).join(",");
        this.url.searchParams.append(column, `in.(${cleanedValues})`);
        return this;
      }
      /**
       * Only relevant for jsonb, array, and range columns. Match only rows where
       * `column` contains every element appearing in `value`.
       *
       * @param column - The jsonb, array, or range column to filter on
       * @param value - The jsonb, array, or range value to filter with
       */
      contains(column, value2) {
        if (typeof value2 === "string") {
          this.url.searchParams.append(column, `cs.${value2}`);
        } else if (Array.isArray(value2)) {
          this.url.searchParams.append(column, `cs.{${value2.join(",")}}`);
        } else {
          this.url.searchParams.append(column, `cs.${JSON.stringify(value2)}`);
        }
        return this;
      }
      /**
       * Only relevant for jsonb, array, and range columns. Match only rows where
       * every element appearing in `column` is contained by `value`.
       *
       * @param column - The jsonb, array, or range column to filter on
       * @param value - The jsonb, array, or range value to filter with
       */
      containedBy(column, value2) {
        if (typeof value2 === "string") {
          this.url.searchParams.append(column, `cd.${value2}`);
        } else if (Array.isArray(value2)) {
          this.url.searchParams.append(column, `cd.{${value2.join(",")}}`);
        } else {
          this.url.searchParams.append(column, `cd.${JSON.stringify(value2)}`);
        }
        return this;
      }
      /**
       * Only relevant for range columns. Match only rows where every element in
       * `column` is greater than any element in `range`.
       *
       * @param column - The range column to filter on
       * @param range - The range to filter with
       */
      rangeGt(column, range) {
        this.url.searchParams.append(column, `sr.${range}`);
        return this;
      }
      /**
       * Only relevant for range columns. Match only rows where every element in
       * `column` is either contained in `range` or greater than any element in
       * `range`.
       *
       * @param column - The range column to filter on
       * @param range - The range to filter with
       */
      rangeGte(column, range) {
        this.url.searchParams.append(column, `nxl.${range}`);
        return this;
      }
      /**
       * Only relevant for range columns. Match only rows where every element in
       * `column` is less than any element in `range`.
       *
       * @param column - The range column to filter on
       * @param range - The range to filter with
       */
      rangeLt(column, range) {
        this.url.searchParams.append(column, `sl.${range}`);
        return this;
      }
      /**
       * Only relevant for range columns. Match only rows where every element in
       * `column` is either contained in `range` or less than any element in
       * `range`.
       *
       * @param column - The range column to filter on
       * @param range - The range to filter with
       */
      rangeLte(column, range) {
        this.url.searchParams.append(column, `nxr.${range}`);
        return this;
      }
      /**
       * Only relevant for range columns. Match only rows where `column` is
       * mutually exclusive to `range` and there can be no element between the two
       * ranges.
       *
       * @param column - The range column to filter on
       * @param range - The range to filter with
       */
      rangeAdjacent(column, range) {
        this.url.searchParams.append(column, `adj.${range}`);
        return this;
      }
      /**
       * Only relevant for array and range columns. Match only rows where
       * `column` and `value` have an element in common.
       *
       * @param column - The array or range column to filter on
       * @param value - The array or range value to filter with
       */
      overlaps(column, value2) {
        if (typeof value2 === "string") {
          this.url.searchParams.append(column, `ov.${value2}`);
        } else {
          this.url.searchParams.append(column, `ov.{${value2.join(",")}}`);
        }
        return this;
      }
      /**
       * Only relevant for text and tsvector columns. Match only rows where
       * `column` matches the query string in `query`.
       *
       * @param column - The text or tsvector column to filter on
       * @param query - The query text to match with
       * @param options - Named parameters
       * @param options.config - The text search configuration to use
       * @param options.type - Change how the `query` text is interpreted
       */
      textSearch(column, query, { config, type } = {}) {
        let typePart = "";
        if (type === "plain") {
          typePart = "pl";
        } else if (type === "phrase") {
          typePart = "ph";
        } else if (type === "websearch") {
          typePart = "w";
        }
        const configPart = config === void 0 ? "" : `(${config})`;
        this.url.searchParams.append(column, `${typePart}fts${configPart}.${query}`);
        return this;
      }
      /**
       * Match only rows where each column in `query` keys is equal to its
       * associated value. Shorthand for multiple `.eq()`s.
       *
       * @param query - The object to filter with, with column names as keys mapped
       * to their filter values
       */
      match(query) {
        Object.entries(query).forEach(([column, value2]) => {
          this.url.searchParams.append(column, `eq.${value2}`);
        });
        return this;
      }
      /**
       * Match only rows which doesn't satisfy the filter.
       *
       * Unlike most filters, `opearator` and `value` are used as-is and need to
       * follow [PostgREST
       * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
       * to make sure they are properly sanitized.
       *
       * @param column - The column to filter on
       * @param operator - The operator to be negated to filter with, following
       * PostgREST syntax
       * @param value - The value to filter with, following PostgREST syntax
       */
      not(column, operator, value2) {
        this.url.searchParams.append(column, `not.${operator}.${value2}`);
        return this;
      }
      /**
       * Match only rows which satisfy at least one of the filters.
       *
       * Unlike most filters, `filters` is used as-is and needs to follow [PostgREST
       * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
       * to make sure it's properly sanitized.
       *
       * It's currently not possible to do an `.or()` filter across multiple tables.
       *
       * @param filters - The filters to use, following PostgREST syntax
       * @param options - Named parameters
       * @param options.referencedTable - Set this to filter on referenced tables
       * instead of the parent table
       * @param options.foreignTable - Deprecated, use `referencedTable` instead
       */
      or(filters, { foreignTable, referencedTable = foreignTable } = {}) {
        const key = referencedTable ? `${referencedTable}.or` : "or";
        this.url.searchParams.append(key, `(${filters})`);
        return this;
      }
      /**
       * Match only rows which satisfy the filter. This is an escape hatch - you
       * should use the specific filter methods wherever possible.
       *
       * Unlike most filters, `opearator` and `value` are used as-is and need to
       * follow [PostgREST
       * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
       * to make sure they are properly sanitized.
       *
       * @param column - The column to filter on
       * @param operator - The operator to filter with, following PostgREST syntax
       * @param value - The value to filter with, following PostgREST syntax
       */
      filter(column, operator, value2) {
        this.url.searchParams.append(column, `${operator}.${value2}`);
        return this;
      }
    };
    exports.default = PostgrestFilterBuilder2;
  }
});

// node_modules/@supabase/postgrest-js/dist/cjs/PostgrestQueryBuilder.js
var require_PostgrestQueryBuilder = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/cjs/PostgrestQueryBuilder.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var PostgrestFilterBuilder_1 = __importDefault(require_PostgrestFilterBuilder());
    var PostgrestQueryBuilder2 = class {
      constructor(url2, { headers = {}, schema, fetch: fetch3 }) {
        this.url = url2;
        this.headers = new Headers(headers);
        this.schema = schema;
        this.fetch = fetch3;
      }
      /**
       * Perform a SELECT query on the table or view.
       *
       * @param columns - The columns to retrieve, separated by commas. Columns can be renamed when returned with `customName:columnName`
       *
       * @param options - Named parameters
       *
       * @param options.head - When set to `true`, `data` will not be returned.
       * Useful if you only need the count.
       *
       * @param options.count - Count algorithm to use to count rows in the table or view.
       *
       * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
       * hood.
       *
       * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
       * statistics under the hood.
       *
       * `"estimated"`: Uses exact count for low numbers and planned count for high
       * numbers.
       */
      select(columns, { head = false, count } = {}) {
        const method = head ? "HEAD" : "GET";
        let quoted = false;
        const cleanedColumns = (columns !== null && columns !== void 0 ? columns : "*").split("").map((c) => {
          if (/\s/.test(c) && !quoted) {
            return "";
          }
          if (c === '"') {
            quoted = !quoted;
          }
          return c;
        }).join("");
        this.url.searchParams.set("select", cleanedColumns);
        if (count) {
          this.headers.append("Prefer", `count=${count}`);
        }
        return new PostgrestFilterBuilder_1.default({
          method,
          url: this.url,
          headers: this.headers,
          schema: this.schema,
          fetch: this.fetch
        });
      }
      /**
       * Perform an INSERT into the table or view.
       *
       * By default, inserted rows are not returned. To return it, chain the call
       * with `.select()`.
       *
       * @param values - The values to insert. Pass an object to insert a single row
       * or an array to insert multiple rows.
       *
       * @param options - Named parameters
       *
       * @param options.count - Count algorithm to use to count inserted rows.
       *
       * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
       * hood.
       *
       * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
       * statistics under the hood.
       *
       * `"estimated"`: Uses exact count for low numbers and planned count for high
       * numbers.
       *
       * @param options.defaultToNull - Make missing fields default to `null`.
       * Otherwise, use the default value for the column. Only applies for bulk
       * inserts.
       */
      insert(values, { count, defaultToNull = true } = {}) {
        var _a;
        const method = "POST";
        if (count) {
          this.headers.append("Prefer", `count=${count}`);
        }
        if (!defaultToNull) {
          this.headers.append("Prefer", `missing=default`);
        }
        if (Array.isArray(values)) {
          const columns = values.reduce((acc, x) => acc.concat(Object.keys(x)), []);
          if (columns.length > 0) {
            const uniqueColumns = [...new Set(columns)].map((column) => `"${column}"`);
            this.url.searchParams.set("columns", uniqueColumns.join(","));
          }
        }
        return new PostgrestFilterBuilder_1.default({
          method,
          url: this.url,
          headers: this.headers,
          schema: this.schema,
          body: values,
          fetch: (_a = this.fetch) !== null && _a !== void 0 ? _a : fetch
        });
      }
      /**
       * Perform an UPSERT on the table or view. Depending on the column(s) passed
       * to `onConflict`, `.upsert()` allows you to perform the equivalent of
       * `.insert()` if a row with the corresponding `onConflict` columns doesn't
       * exist, or if it does exist, perform an alternative action depending on
       * `ignoreDuplicates`.
       *
       * By default, upserted rows are not returned. To return it, chain the call
       * with `.select()`.
       *
       * @param values - The values to upsert with. Pass an object to upsert a
       * single row or an array to upsert multiple rows.
       *
       * @param options - Named parameters
       *
       * @param options.onConflict - Comma-separated UNIQUE column(s) to specify how
       * duplicate rows are determined. Two rows are duplicates if all the
       * `onConflict` columns are equal.
       *
       * @param options.ignoreDuplicates - If `true`, duplicate rows are ignored. If
       * `false`, duplicate rows are merged with existing rows.
       *
       * @param options.count - Count algorithm to use to count upserted rows.
       *
       * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
       * hood.
       *
       * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
       * statistics under the hood.
       *
       * `"estimated"`: Uses exact count for low numbers and planned count for high
       * numbers.
       *
       * @param options.defaultToNull - Make missing fields default to `null`.
       * Otherwise, use the default value for the column. This only applies when
       * inserting new rows, not when merging with existing rows under
       * `ignoreDuplicates: false`. This also only applies when doing bulk upserts.
       */
      upsert(values, { onConflict, ignoreDuplicates = false, count, defaultToNull = true } = {}) {
        var _a;
        const method = "POST";
        this.headers.append("Prefer", `resolution=${ignoreDuplicates ? "ignore" : "merge"}-duplicates`);
        if (onConflict !== void 0)
          this.url.searchParams.set("on_conflict", onConflict);
        if (count) {
          this.headers.append("Prefer", `count=${count}`);
        }
        if (!defaultToNull) {
          this.headers.append("Prefer", "missing=default");
        }
        if (Array.isArray(values)) {
          const columns = values.reduce((acc, x) => acc.concat(Object.keys(x)), []);
          if (columns.length > 0) {
            const uniqueColumns = [...new Set(columns)].map((column) => `"${column}"`);
            this.url.searchParams.set("columns", uniqueColumns.join(","));
          }
        }
        return new PostgrestFilterBuilder_1.default({
          method,
          url: this.url,
          headers: this.headers,
          schema: this.schema,
          body: values,
          fetch: (_a = this.fetch) !== null && _a !== void 0 ? _a : fetch
        });
      }
      /**
       * Perform an UPDATE on the table or view.
       *
       * By default, updated rows are not returned. To return it, chain the call
       * with `.select()` after filters.
       *
       * @param values - The values to update with
       *
       * @param options - Named parameters
       *
       * @param options.count - Count algorithm to use to count updated rows.
       *
       * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
       * hood.
       *
       * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
       * statistics under the hood.
       *
       * `"estimated"`: Uses exact count for low numbers and planned count for high
       * numbers.
       */
      update(values, { count } = {}) {
        var _a;
        const method = "PATCH";
        if (count) {
          this.headers.append("Prefer", `count=${count}`);
        }
        return new PostgrestFilterBuilder_1.default({
          method,
          url: this.url,
          headers: this.headers,
          schema: this.schema,
          body: values,
          fetch: (_a = this.fetch) !== null && _a !== void 0 ? _a : fetch
        });
      }
      /**
       * Perform a DELETE on the table or view.
       *
       * By default, deleted rows are not returned. To return it, chain the call
       * with `.select()` after filters.
       *
       * @param options - Named parameters
       *
       * @param options.count - Count algorithm to use to count deleted rows.
       *
       * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
       * hood.
       *
       * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
       * statistics under the hood.
       *
       * `"estimated"`: Uses exact count for low numbers and planned count for high
       * numbers.
       */
      delete({ count } = {}) {
        var _a;
        const method = "DELETE";
        if (count) {
          this.headers.append("Prefer", `count=${count}`);
        }
        return new PostgrestFilterBuilder_1.default({
          method,
          url: this.url,
          headers: this.headers,
          schema: this.schema,
          fetch: (_a = this.fetch) !== null && _a !== void 0 ? _a : fetch
        });
      }
    };
    exports.default = PostgrestQueryBuilder2;
  }
});

// node_modules/@supabase/postgrest-js/dist/cjs/PostgrestClient.js
var require_PostgrestClient = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/cjs/PostgrestClient.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var PostgrestQueryBuilder_1 = __importDefault(require_PostgrestQueryBuilder());
    var PostgrestFilterBuilder_1 = __importDefault(require_PostgrestFilterBuilder());
    var PostgrestClient2 = class _PostgrestClient {
      // TODO: Add back shouldThrowOnError once we figure out the typings
      /**
       * Creates a PostgREST client.
       *
       * @param url - URL of the PostgREST endpoint
       * @param options - Named parameters
       * @param options.headers - Custom headers
       * @param options.schema - Postgres schema to switch to
       * @param options.fetch - Custom fetch
       */
      constructor(url2, { headers = {}, schema, fetch: fetch3 } = {}) {
        this.url = url2;
        this.headers = new Headers(headers);
        this.schemaName = schema;
        this.fetch = fetch3;
      }
      /**
       * Perform a query on a table or a view.
       *
       * @param relation - The table or view name to query
       */
      from(relation) {
        const url2 = new URL(`${this.url}/${relation}`);
        return new PostgrestQueryBuilder_1.default(url2, {
          headers: new Headers(this.headers),
          schema: this.schemaName,
          fetch: this.fetch
        });
      }
      /**
       * Select a schema to query or perform an function (rpc) call.
       *
       * The schema needs to be on the list of exposed schemas inside Supabase.
       *
       * @param schema - The schema to query
       */
      schema(schema) {
        return new _PostgrestClient(this.url, {
          headers: this.headers,
          schema,
          fetch: this.fetch
        });
      }
      /**
       * Perform a function call.
       *
       * @param fn - The function name to call
       * @param args - The arguments to pass to the function call
       * @param options - Named parameters
       * @param options.head - When set to `true`, `data` will not be returned.
       * Useful if you only need the count.
       * @param options.get - When set to `true`, the function will be called with
       * read-only access mode.
       * @param options.count - Count algorithm to use to count rows returned by the
       * function. Only applicable for [set-returning
       * functions](https://www.postgresql.org/docs/current/functions-srf.html).
       *
       * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
       * hood.
       *
       * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
       * statistics under the hood.
       *
       * `"estimated"`: Uses exact count for low numbers and planned count for high
       * numbers.
       */
      rpc(fn, args = {}, { head = false, get = false, count } = {}) {
        var _a;
        let method;
        const url2 = new URL(`${this.url}/rpc/${fn}`);
        let body;
        if (head || get) {
          method = head ? "HEAD" : "GET";
          Object.entries(args).filter(([_, value2]) => value2 !== void 0).map(([name, value2]) => [name, Array.isArray(value2) ? `{${value2.join(",")}}` : `${value2}`]).forEach(([name, value2]) => {
            url2.searchParams.append(name, value2);
          });
        } else {
          method = "POST";
          body = args;
        }
        const headers = new Headers(this.headers);
        if (count) {
          headers.set("Prefer", `count=${count}`);
        }
        return new PostgrestFilterBuilder_1.default({
          method,
          url: url2,
          headers,
          schema: this.schemaName,
          body,
          fetch: (_a = this.fetch) !== null && _a !== void 0 ? _a : fetch
        });
      }
    };
    exports.default = PostgrestClient2;
  }
});

// node_modules/@supabase/postgrest-js/dist/cjs/index.js
var require_cjs = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/cjs/index.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PostgrestError = exports.PostgrestBuilder = exports.PostgrestTransformBuilder = exports.PostgrestFilterBuilder = exports.PostgrestQueryBuilder = exports.PostgrestClient = void 0;
    var PostgrestClient_1 = __importDefault(require_PostgrestClient());
    exports.PostgrestClient = PostgrestClient_1.default;
    var PostgrestQueryBuilder_1 = __importDefault(require_PostgrestQueryBuilder());
    exports.PostgrestQueryBuilder = PostgrestQueryBuilder_1.default;
    var PostgrestFilterBuilder_1 = __importDefault(require_PostgrestFilterBuilder());
    exports.PostgrestFilterBuilder = PostgrestFilterBuilder_1.default;
    var PostgrestTransformBuilder_1 = __importDefault(require_PostgrestTransformBuilder());
    exports.PostgrestTransformBuilder = PostgrestTransformBuilder_1.default;
    var PostgrestBuilder_1 = __importDefault(require_PostgrestBuilder());
    exports.PostgrestBuilder = PostgrestBuilder_1.default;
    var PostgrestError_1 = __importDefault(require_PostgrestError());
    exports.PostgrestError = PostgrestError_1.default;
    exports.default = {
      PostgrestClient: PostgrestClient_1.default,
      PostgrestQueryBuilder: PostgrestQueryBuilder_1.default,
      PostgrestFilterBuilder: PostgrestFilterBuilder_1.default,
      PostgrestTransformBuilder: PostgrestTransformBuilder_1.default,
      PostgrestBuilder: PostgrestBuilder_1.default,
      PostgrestError: PostgrestError_1.default
    };
  }
});

// assets/js/ni/vendor/crypto-shim.js
var crypto_shim_exports = {};
__export(crypto_shim_exports, {
  default: () => crypto_shim_default,
  webcrypto: () => webcrypto
});
var webcrypto, crypto_shim_default;
var init_crypto_shim = __esm({
  "assets/js/ni/vendor/crypto-shim.js"() {
    webcrypto = globalThis.crypto;
    crypto_shim_default = { webcrypto: globalThis.crypto };
  }
});

// node_modules/engine.io-parser/build/esm/commons.js
var PACKET_TYPES, PACKET_TYPES_REVERSE, ERROR_PACKET;
var init_commons = __esm({
  "node_modules/engine.io-parser/build/esm/commons.js"() {
    PACKET_TYPES = /* @__PURE__ */ Object.create(null);
    PACKET_TYPES["open"] = "0";
    PACKET_TYPES["close"] = "1";
    PACKET_TYPES["ping"] = "2";
    PACKET_TYPES["pong"] = "3";
    PACKET_TYPES["message"] = "4";
    PACKET_TYPES["upgrade"] = "5";
    PACKET_TYPES["noop"] = "6";
    PACKET_TYPES_REVERSE = /* @__PURE__ */ Object.create(null);
    Object.keys(PACKET_TYPES).forEach((key) => {
      PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
    });
    ERROR_PACKET = { type: "error", data: "parser error" };
  }
});

// node_modules/engine.io-parser/build/esm/encodePacket.browser.js
function toArray(data) {
  if (data instanceof Uint8Array) {
    return data;
  } else if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  } else {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
}
function encodePacketToBinary(packet, callback) {
  if (withNativeBlob && packet.data instanceof Blob) {
    return packet.data.arrayBuffer().then(toArray).then(callback);
  } else if (withNativeArrayBuffer && (packet.data instanceof ArrayBuffer || isView(packet.data))) {
    return callback(toArray(packet.data));
  }
  encodePacket(packet, false, (encoded) => {
    if (!TEXT_ENCODER) {
      TEXT_ENCODER = new TextEncoder();
    }
    callback(TEXT_ENCODER.encode(encoded));
  });
}
var withNativeBlob, withNativeArrayBuffer, isView, encodePacket, encodeBlobAsBase64, TEXT_ENCODER;
var init_encodePacket_browser = __esm({
  "node_modules/engine.io-parser/build/esm/encodePacket.browser.js"() {
    init_commons();
    withNativeBlob = typeof Blob === "function" || typeof Blob !== "undefined" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]";
    withNativeArrayBuffer = typeof ArrayBuffer === "function";
    isView = (obj) => {
      return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj && obj.buffer instanceof ArrayBuffer;
    };
    encodePacket = ({ type, data }, supportsBinary, callback) => {
      if (withNativeBlob && data instanceof Blob) {
        if (supportsBinary) {
          return callback(data);
        } else {
          return encodeBlobAsBase64(data, callback);
        }
      } else if (withNativeArrayBuffer && (data instanceof ArrayBuffer || isView(data))) {
        if (supportsBinary) {
          return callback(data);
        } else {
          return encodeBlobAsBase64(new Blob([data]), callback);
        }
      }
      return callback(PACKET_TYPES[type] + (data || ""));
    };
    encodeBlobAsBase64 = (data, callback) => {
      const fileReader = new FileReader();
      fileReader.onload = function() {
        const content = fileReader.result.split(",")[1];
        callback("b" + (content || ""));
      };
      return fileReader.readAsDataURL(data);
    };
  }
});

// node_modules/engine.io-parser/build/esm/contrib/base64-arraybuffer.js
var chars, lookup, decode;
var init_base64_arraybuffer = __esm({
  "node_modules/engine.io-parser/build/esm/contrib/base64-arraybuffer.js"() {
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    lookup = typeof Uint8Array === "undefined" ? [] : new Uint8Array(256);
    for (let i = 0; i < chars.length; i++) {
      lookup[chars.charCodeAt(i)] = i;
    }
    decode = (base64) => {
      let bufferLength = base64.length * 0.75, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
      if (base64[base64.length - 1] === "=") {
        bufferLength--;
        if (base64[base64.length - 2] === "=") {
          bufferLength--;
        }
      }
      const arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
      for (i = 0; i < len; i += 4) {
        encoded1 = lookup[base64.charCodeAt(i)];
        encoded2 = lookup[base64.charCodeAt(i + 1)];
        encoded3 = lookup[base64.charCodeAt(i + 2)];
        encoded4 = lookup[base64.charCodeAt(i + 3)];
        bytes[p++] = encoded1 << 2 | encoded2 >> 4;
        bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
        bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
      }
      return arraybuffer;
    };
  }
});

// node_modules/engine.io-parser/build/esm/decodePacket.browser.js
var withNativeArrayBuffer2, decodePacket, decodeBase64Packet, mapBinary;
var init_decodePacket_browser = __esm({
  "node_modules/engine.io-parser/build/esm/decodePacket.browser.js"() {
    init_commons();
    init_base64_arraybuffer();
    withNativeArrayBuffer2 = typeof ArrayBuffer === "function";
    decodePacket = (encodedPacket, binaryType) => {
      if (typeof encodedPacket !== "string") {
        return {
          type: "message",
          data: mapBinary(encodedPacket, binaryType)
        };
      }
      const type = encodedPacket.charAt(0);
      if (type === "b") {
        return {
          type: "message",
          data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
        };
      }
      const packetType = PACKET_TYPES_REVERSE[type];
      if (!packetType) {
        return ERROR_PACKET;
      }
      return encodedPacket.length > 1 ? {
        type: PACKET_TYPES_REVERSE[type],
        data: encodedPacket.substring(1)
      } : {
        type: PACKET_TYPES_REVERSE[type]
      };
    };
    decodeBase64Packet = (data, binaryType) => {
      if (withNativeArrayBuffer2) {
        const decoded = decode(data);
        return mapBinary(decoded, binaryType);
      } else {
        return { base64: true, data };
      }
    };
    mapBinary = (data, binaryType) => {
      switch (binaryType) {
        case "blob":
          if (data instanceof Blob) {
            return data;
          } else {
            return new Blob([data]);
          }
        case "arraybuffer":
        default:
          if (data instanceof ArrayBuffer) {
            return data;
          } else {
            return data.buffer;
          }
      }
    };
  }
});

// node_modules/engine.io-parser/build/esm/index.js
function createPacketEncoderStream() {
  return new TransformStream({
    transform(packet, controller) {
      encodePacketToBinary(packet, (encodedPacket) => {
        const payloadLength = encodedPacket.length;
        let header;
        if (payloadLength < 126) {
          header = new Uint8Array(1);
          new DataView(header.buffer).setUint8(0, payloadLength);
        } else if (payloadLength < 65536) {
          header = new Uint8Array(3);
          const view = new DataView(header.buffer);
          view.setUint8(0, 126);
          view.setUint16(1, payloadLength);
        } else {
          header = new Uint8Array(9);
          const view = new DataView(header.buffer);
          view.setUint8(0, 127);
          view.setBigUint64(1, BigInt(payloadLength));
        }
        if (packet.data && typeof packet.data !== "string") {
          header[0] |= 128;
        }
        controller.enqueue(header);
        controller.enqueue(encodedPacket);
      });
    }
  });
}
function totalLength(chunks) {
  return chunks.reduce((acc, chunk) => acc + chunk.length, 0);
}
function concatChunks(chunks, size) {
  if (chunks[0].length === size) {
    return chunks.shift();
  }
  const buffer = new Uint8Array(size);
  let j = 0;
  for (let i = 0; i < size; i++) {
    buffer[i] = chunks[0][j++];
    if (j === chunks[0].length) {
      chunks.shift();
      j = 0;
    }
  }
  if (chunks.length && j < chunks[0].length) {
    chunks[0] = chunks[0].slice(j);
  }
  return buffer;
}
function createPacketDecoderStream(maxPayload, binaryType) {
  if (!TEXT_DECODER) {
    TEXT_DECODER = new TextDecoder();
  }
  const chunks = [];
  let state = 0;
  let expectedLength = -1;
  let isBinary2 = false;
  return new TransformStream({
    transform(chunk, controller) {
      chunks.push(chunk);
      while (true) {
        if (state === 0) {
          if (totalLength(chunks) < 1) {
            break;
          }
          const header = concatChunks(chunks, 1);
          isBinary2 = (header[0] & 128) === 128;
          expectedLength = header[0] & 127;
          if (expectedLength < 126) {
            state = 3;
          } else if (expectedLength === 126) {
            state = 1;
          } else {
            state = 2;
          }
        } else if (state === 1) {
          if (totalLength(chunks) < 2) {
            break;
          }
          const headerArray = concatChunks(chunks, 2);
          expectedLength = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length).getUint16(0);
          state = 3;
        } else if (state === 2) {
          if (totalLength(chunks) < 8) {
            break;
          }
          const headerArray = concatChunks(chunks, 8);
          const view = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length);
          const n = view.getUint32(0);
          if (n > Math.pow(2, 53 - 32) - 1) {
            controller.enqueue(ERROR_PACKET);
            break;
          }
          expectedLength = n * Math.pow(2, 32) + view.getUint32(4);
          state = 3;
        } else {
          if (totalLength(chunks) < expectedLength) {
            break;
          }
          const data = concatChunks(chunks, expectedLength);
          controller.enqueue(decodePacket(isBinary2 ? data : TEXT_DECODER.decode(data), binaryType));
          state = 0;
        }
        if (expectedLength === 0 || expectedLength > maxPayload) {
          controller.enqueue(ERROR_PACKET);
          break;
        }
      }
    }
  });
}
var SEPARATOR, encodePayload, decodePayload, TEXT_DECODER, protocol;
var init_esm = __esm({
  "node_modules/engine.io-parser/build/esm/index.js"() {
    init_encodePacket_browser();
    init_decodePacket_browser();
    init_commons();
    SEPARATOR = String.fromCharCode(30);
    encodePayload = (packets, callback) => {
      const length = packets.length;
      const encodedPackets = new Array(length);
      let count = 0;
      packets.forEach((packet, i) => {
        encodePacket(packet, false, (encodedPacket) => {
          encodedPackets[i] = encodedPacket;
          if (++count === length) {
            callback(encodedPackets.join(SEPARATOR));
          }
        });
      });
    };
    decodePayload = (encodedPayload, binaryType) => {
      const encodedPackets = encodedPayload.split(SEPARATOR);
      const packets = [];
      for (let i = 0; i < encodedPackets.length; i++) {
        const decodedPacket = decodePacket(encodedPackets[i], binaryType);
        packets.push(decodedPacket);
        if (decodedPacket.type === "error") {
          break;
        }
      }
      return packets;
    };
    protocol = 4;
  }
});

// node_modules/@socket.io/component-emitter/lib/esm/index.js
function Emitter(obj) {
  if (obj) return mixin(obj);
}
function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}
var init_esm2 = __esm({
  "node_modules/@socket.io/component-emitter/lib/esm/index.js"() {
    Emitter.prototype.on = Emitter.prototype.addEventListener = function(event, fn) {
      this._callbacks = this._callbacks || {};
      (this._callbacks["$" + event] = this._callbacks["$" + event] || []).push(fn);
      return this;
    };
    Emitter.prototype.once = function(event, fn) {
      function on2() {
        this.off(event, on2);
        fn.apply(this, arguments);
      }
      on2.fn = fn;
      this.on(event, on2);
      return this;
    };
    Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function(event, fn) {
      this._callbacks = this._callbacks || {};
      if (0 == arguments.length) {
        this._callbacks = {};
        return this;
      }
      var callbacks = this._callbacks["$" + event];
      if (!callbacks) return this;
      if (1 == arguments.length) {
        delete this._callbacks["$" + event];
        return this;
      }
      var cb;
      for (var i = 0; i < callbacks.length; i++) {
        cb = callbacks[i];
        if (cb === fn || cb.fn === fn) {
          callbacks.splice(i, 1);
          break;
        }
      }
      if (callbacks.length === 0) {
        delete this._callbacks["$" + event];
      }
      return this;
    };
    Emitter.prototype.emit = function(event) {
      this._callbacks = this._callbacks || {};
      var args = new Array(arguments.length - 1), callbacks = this._callbacks["$" + event];
      for (var i = 1; i < arguments.length; i++) {
        args[i - 1] = arguments[i];
      }
      if (callbacks) {
        callbacks = callbacks.slice(0);
        for (var i = 0, len = callbacks.length; i < len; ++i) {
          callbacks[i].apply(this, args);
        }
      }
      return this;
    };
    Emitter.prototype.emitReserved = Emitter.prototype.emit;
    Emitter.prototype.listeners = function(event) {
      this._callbacks = this._callbacks || {};
      return this._callbacks["$" + event] || [];
    };
    Emitter.prototype.hasListeners = function(event) {
      return !!this.listeners(event).length;
    };
  }
});

// node_modules/engine.io-client/build/esm/globals.js
function createCookieJar() {
}
var nextTick, globalThisShim, defaultBinaryType;
var init_globals = __esm({
  "node_modules/engine.io-client/build/esm/globals.js"() {
    nextTick = (() => {
      const isPromiseAvailable = typeof Promise === "function" && typeof Promise.resolve === "function";
      if (isPromiseAvailable) {
        return (cb) => Promise.resolve().then(cb);
      } else {
        return (cb, setTimeoutFn) => setTimeoutFn(cb, 0);
      }
    })();
    globalThisShim = (() => {
      if (typeof self !== "undefined") {
        return self;
      } else if (typeof window !== "undefined") {
        return window;
      } else {
        return Function("return this")();
      }
    })();
    defaultBinaryType = "arraybuffer";
  }
});

// node_modules/engine.io-client/build/esm/util.js
function pick(obj, ...attr) {
  return attr.reduce((acc, k) => {
    if (obj.hasOwnProperty(k)) {
      acc[k] = obj[k];
    }
    return acc;
  }, {});
}
function installTimerFunctions(obj, opts) {
  if (opts.useNativeTimers) {
    obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(globalThisShim);
    obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(globalThisShim);
  } else {
    obj.setTimeoutFn = globalThisShim.setTimeout.bind(globalThisShim);
    obj.clearTimeoutFn = globalThisShim.clearTimeout.bind(globalThisShim);
  }
}
function byteLength(obj) {
  if (typeof obj === "string") {
    return utf8Length(obj);
  }
  return Math.ceil((obj.byteLength || obj.size) * BASE64_OVERHEAD);
}
function utf8Length(str) {
  let c = 0, length = 0;
  for (let i = 0, l = str.length; i < l; i++) {
    c = str.charCodeAt(i);
    if (c < 128) {
      length += 1;
    } else if (c < 2048) {
      length += 2;
    } else if (c < 55296 || c >= 57344) {
      length += 3;
    } else {
      i++;
      length += 4;
    }
  }
  return length;
}
function randomString() {
  return Date.now().toString(36).substring(3) + Math.random().toString(36).substring(2, 5);
}
var NATIVE_SET_TIMEOUT, NATIVE_CLEAR_TIMEOUT, BASE64_OVERHEAD;
var init_util = __esm({
  "node_modules/engine.io-client/build/esm/util.js"() {
    init_globals();
    NATIVE_SET_TIMEOUT = globalThisShim.setTimeout;
    NATIVE_CLEAR_TIMEOUT = globalThisShim.clearTimeout;
    BASE64_OVERHEAD = 1.33;
  }
});

// node_modules/engine.io-client/build/esm/contrib/parseqs.js
function encode(obj) {
  let str = "";
  for (let i in obj) {
    if (obj.hasOwnProperty(i)) {
      if (str.length)
        str += "&";
      str += encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]);
    }
  }
  return str;
}
function decode2(qs) {
  let qry = {};
  let pairs = qs.split("&");
  for (let i = 0, l = pairs.length; i < l; i++) {
    let pair = pairs[i].split("=");
    qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return qry;
}
var init_parseqs = __esm({
  "node_modules/engine.io-client/build/esm/contrib/parseqs.js"() {
  }
});

// node_modules/engine.io-client/build/esm/transport.js
var TransportError, Transport;
var init_transport = __esm({
  "node_modules/engine.io-client/build/esm/transport.js"() {
    init_esm();
    init_esm2();
    init_util();
    init_parseqs();
    TransportError = class extends Error {
      constructor(reason, description, context) {
        super(reason);
        this.description = description;
        this.context = context;
        this.type = "TransportError";
      }
    };
    Transport = class extends Emitter {
      /**
       * Transport abstract constructor.
       *
       * @param {Object} opts - options
       * @protected
       */
      constructor(opts) {
        super();
        this.writable = false;
        installTimerFunctions(this, opts);
        this.opts = opts;
        this.query = opts.query;
        this.socket = opts.socket;
        this.supportsBinary = !opts.forceBase64;
      }
      /**
       * Emits an error.
       *
       * @param {String} reason
       * @param description
       * @param context - the error context
       * @return {Transport} for chaining
       * @protected
       */
      onError(reason, description, context) {
        super.emitReserved("error", new TransportError(reason, description, context));
        return this;
      }
      /**
       * Opens the transport.
       */
      open() {
        this.readyState = "opening";
        this.doOpen();
        return this;
      }
      /**
       * Closes the transport.
       */
      close() {
        if (this.readyState === "opening" || this.readyState === "open") {
          this.doClose();
          this.onClose();
        }
        return this;
      }
      /**
       * Sends multiple packets.
       *
       * @param {Array} packets
       */
      send(packets) {
        if (this.readyState === "open") {
          this.write(packets);
        } else {
        }
      }
      /**
       * Called upon open
       *
       * @protected
       */
      onOpen() {
        this.readyState = "open";
        this.writable = true;
        super.emitReserved("open");
      }
      /**
       * Called with data.
       *
       * @param {String} data
       * @protected
       */
      onData(data) {
        const packet = decodePacket(data, this.socket.binaryType);
        this.onPacket(packet);
      }
      /**
       * Called with a decoded packet.
       *
       * @protected
       */
      onPacket(packet) {
        super.emitReserved("packet", packet);
      }
      /**
       * Called upon close.
       *
       * @protected
       */
      onClose(details) {
        this.readyState = "closed";
        super.emitReserved("close", details);
      }
      /**
       * Pauses the transport, in order not to lose packets during an upgrade.
       *
       * @param onPause
       */
      pause(onPause) {
      }
      createUri(schema, query = {}) {
        return schema + "://" + this._hostname() + this._port() + this.opts.path + this._query(query);
      }
      _hostname() {
        const hostname = this.opts.hostname;
        return hostname.indexOf(":") === -1 ? hostname : "[" + hostname + "]";
      }
      _port() {
        if (this.opts.port && (this.opts.secure && Number(this.opts.port) !== 443 || !this.opts.secure && Number(this.opts.port) !== 80)) {
          return ":" + this.opts.port;
        } else {
          return "";
        }
      }
      _query(query) {
        const encodedQuery = encode(query);
        return encodedQuery.length ? "?" + encodedQuery : "";
      }
    };
  }
});

// node_modules/engine.io-client/build/esm/transports/polling.js
var Polling;
var init_polling = __esm({
  "node_modules/engine.io-client/build/esm/transports/polling.js"() {
    init_transport();
    init_util();
    init_esm();
    Polling = class extends Transport {
      constructor() {
        super(...arguments);
        this._polling = false;
      }
      get name() {
        return "polling";
      }
      /**
       * Opens the socket (triggers polling). We write a PING message to determine
       * when the transport is open.
       *
       * @protected
       */
      doOpen() {
        this._poll();
      }
      /**
       * Pauses polling.
       *
       * @param {Function} onPause - callback upon buffers are flushed and transport is paused
       * @package
       */
      pause(onPause) {
        this.readyState = "pausing";
        const pause = () => {
          this.readyState = "paused";
          onPause();
        };
        if (this._polling || !this.writable) {
          let total = 0;
          if (this._polling) {
            total++;
            this.once("pollComplete", function() {
              --total || pause();
            });
          }
          if (!this.writable) {
            total++;
            this.once("drain", function() {
              --total || pause();
            });
          }
        } else {
          pause();
        }
      }
      /**
       * Starts polling cycle.
       *
       * @private
       */
      _poll() {
        this._polling = true;
        this.doPoll();
        this.emitReserved("poll");
      }
      /**
       * Overloads onData to detect payloads.
       *
       * @protected
       */
      onData(data) {
        const callback = (packet) => {
          if ("opening" === this.readyState && packet.type === "open") {
            this.onOpen();
          }
          if ("close" === packet.type) {
            this.onClose({ description: "transport closed by the server" });
            return false;
          }
          this.onPacket(packet);
        };
        decodePayload(data, this.socket.binaryType).forEach(callback);
        if ("closed" !== this.readyState) {
          this._polling = false;
          this.emitReserved("pollComplete");
          if ("open" === this.readyState) {
            this._poll();
          } else {
          }
        }
      }
      /**
       * For polling, send a close packet.
       *
       * @protected
       */
      doClose() {
        const close = () => {
          this.write([{ type: "close" }]);
        };
        if ("open" === this.readyState) {
          close();
        } else {
          this.once("open", close);
        }
      }
      /**
       * Writes a packets payload.
       *
       * @param {Array} packets - data packets
       * @protected
       */
      write(packets) {
        this.writable = false;
        encodePayload(packets, (data) => {
          this.doWrite(data, () => {
            this.writable = true;
            this.emitReserved("drain");
          });
        });
      }
      /**
       * Generates uri for connection.
       *
       * @private
       */
      uri() {
        const schema = this.opts.secure ? "https" : "http";
        const query = this.query || {};
        if (false !== this.opts.timestampRequests) {
          query[this.opts.timestampParam] = randomString();
        }
        if (!this.supportsBinary && !query.sid) {
          query.b64 = 1;
        }
        return this.createUri(schema, query);
      }
    };
  }
});

// node_modules/engine.io-client/build/esm/contrib/has-cors.js
var value, hasCORS;
var init_has_cors = __esm({
  "node_modules/engine.io-client/build/esm/contrib/has-cors.js"() {
    value = false;
    try {
      value = typeof XMLHttpRequest !== "undefined" && "withCredentials" in new XMLHttpRequest();
    } catch (err) {
    }
    hasCORS = value;
  }
});

// node_modules/engine.io-client/build/esm/transports/polling-xhr.js
function empty() {
}
function unloadHandler() {
  for (let i in Request3.requests) {
    if (Request3.requests.hasOwnProperty(i)) {
      Request3.requests[i].abort();
    }
  }
}
function newRequest(opts) {
  const xdomain = opts.xdomain;
  try {
    if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
      return new XMLHttpRequest();
    }
  } catch (e) {
  }
  if (!xdomain) {
    try {
      return new globalThisShim[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
    } catch (e) {
    }
  }
}
var BaseXHR, Request3, hasXHR2, XHR;
var init_polling_xhr = __esm({
  "node_modules/engine.io-client/build/esm/transports/polling-xhr.js"() {
    init_polling();
    init_esm2();
    init_util();
    init_globals();
    init_has_cors();
    BaseXHR = class extends Polling {
      /**
       * XHR Polling constructor.
       *
       * @param {Object} opts
       * @package
       */
      constructor(opts) {
        super(opts);
        if (typeof location !== "undefined") {
          const isSSL = "https:" === location.protocol;
          let port = location.port;
          if (!port) {
            port = isSSL ? "443" : "80";
          }
          this.xd = typeof location !== "undefined" && opts.hostname !== location.hostname || port !== opts.port;
        }
      }
      /**
       * Sends data.
       *
       * @param {String} data - data to send.
       * @param {Function} fn - called upon flush.
       * @private
       */
      doWrite(data, fn) {
        const req = this.request({
          method: "POST",
          data
        });
        req.on("success", fn);
        req.on("error", (xhrStatus, context) => {
          this.onError("xhr post error", xhrStatus, context);
        });
      }
      /**
       * Starts a poll cycle.
       *
       * @private
       */
      doPoll() {
        const req = this.request();
        req.on("data", this.onData.bind(this));
        req.on("error", (xhrStatus, context) => {
          this.onError("xhr poll error", xhrStatus, context);
        });
        this.pollXhr = req;
      }
    };
    Request3 = class _Request extends Emitter {
      /**
       * Request constructor
       *
       * @param {Object} options
       * @package
       */
      constructor(createRequest, uri, opts) {
        super();
        this.createRequest = createRequest;
        installTimerFunctions(this, opts);
        this._opts = opts;
        this._method = opts.method || "GET";
        this._uri = uri;
        this._data = void 0 !== opts.data ? opts.data : null;
        this._create();
      }
      /**
       * Creates the XHR object and sends the request.
       *
       * @private
       */
      _create() {
        var _a;
        const opts = pick(this._opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
        opts.xdomain = !!this._opts.xd;
        const xhr = this._xhr = this.createRequest(opts);
        try {
          xhr.open(this._method, this._uri, true);
          try {
            if (this._opts.extraHeaders) {
              xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
              for (let i in this._opts.extraHeaders) {
                if (this._opts.extraHeaders.hasOwnProperty(i)) {
                  xhr.setRequestHeader(i, this._opts.extraHeaders[i]);
                }
              }
            }
          } catch (e) {
          }
          if ("POST" === this._method) {
            try {
              xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
            } catch (e) {
            }
          }
          try {
            xhr.setRequestHeader("Accept", "*/*");
          } catch (e) {
          }
          (_a = this._opts.cookieJar) === null || _a === void 0 ? void 0 : _a.addCookies(xhr);
          if ("withCredentials" in xhr) {
            xhr.withCredentials = this._opts.withCredentials;
          }
          if (this._opts.requestTimeout) {
            xhr.timeout = this._opts.requestTimeout;
          }
          xhr.onreadystatechange = () => {
            var _a2;
            if (xhr.readyState === 3) {
              (_a2 = this._opts.cookieJar) === null || _a2 === void 0 ? void 0 : _a2.parseCookies(
                // @ts-ignore
                xhr.getResponseHeader("set-cookie")
              );
            }
            if (4 !== xhr.readyState)
              return;
            if (200 === xhr.status || 1223 === xhr.status) {
              this._onLoad();
            } else {
              this.setTimeoutFn(() => {
                this._onError(typeof xhr.status === "number" ? xhr.status : 0);
              }, 0);
            }
          };
          xhr.send(this._data);
        } catch (e) {
          this.setTimeoutFn(() => {
            this._onError(e);
          }, 0);
          return;
        }
        if (typeof document !== "undefined") {
          this._index = _Request.requestsCount++;
          _Request.requests[this._index] = this;
        }
      }
      /**
       * Called upon error.
       *
       * @private
       */
      _onError(err) {
        this.emitReserved("error", err, this._xhr);
        this._cleanup(true);
      }
      /**
       * Cleans up house.
       *
       * @private
       */
      _cleanup(fromError) {
        if ("undefined" === typeof this._xhr || null === this._xhr) {
          return;
        }
        this._xhr.onreadystatechange = empty;
        if (fromError) {
          try {
            this._xhr.abort();
          } catch (e) {
          }
        }
        if (typeof document !== "undefined") {
          delete _Request.requests[this._index];
        }
        this._xhr = null;
      }
      /**
       * Called upon load.
       *
       * @private
       */
      _onLoad() {
        const data = this._xhr.responseText;
        if (data !== null) {
          this.emitReserved("data", data);
          this.emitReserved("success");
          this._cleanup();
        }
      }
      /**
       * Aborts the request.
       *
       * @package
       */
      abort() {
        this._cleanup();
      }
    };
    Request3.requestsCount = 0;
    Request3.requests = {};
    if (typeof document !== "undefined") {
      if (typeof attachEvent === "function") {
        attachEvent("onunload", unloadHandler);
      } else if (typeof addEventListener === "function") {
        const terminationEvent = "onpagehide" in globalThisShim ? "pagehide" : "unload";
        addEventListener(terminationEvent, unloadHandler, false);
      }
    }
    hasXHR2 = (function() {
      const xhr = newRequest({
        xdomain: false
      });
      return xhr && xhr.responseType !== null;
    })();
    XHR = class extends BaseXHR {
      constructor(opts) {
        super(opts);
        const forceBase64 = opts && opts.forceBase64;
        this.supportsBinary = hasXHR2 && !forceBase64;
      }
      request(opts = {}) {
        Object.assign(opts, { xd: this.xd }, this.opts);
        return new Request3(newRequest, this.uri(), opts);
      }
    };
  }
});

// node_modules/engine.io-client/build/esm/transports/websocket.js
var isReactNative, BaseWS, WebSocketCtor, WS;
var init_websocket = __esm({
  "node_modules/engine.io-client/build/esm/transports/websocket.js"() {
    init_transport();
    init_util();
    init_esm();
    init_globals();
    isReactNative = typeof navigator !== "undefined" && typeof navigator.product === "string" && navigator.product.toLowerCase() === "reactnative";
    BaseWS = class extends Transport {
      get name() {
        return "websocket";
      }
      doOpen() {
        const uri = this.uri();
        const protocols = this.opts.protocols;
        const opts = isReactNative ? {} : pick(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
        if (this.opts.extraHeaders) {
          opts.headers = this.opts.extraHeaders;
        }
        try {
          this.ws = this.createSocket(uri, protocols, opts);
        } catch (err) {
          return this.emitReserved("error", err);
        }
        this.ws.binaryType = this.socket.binaryType;
        this.addEventListeners();
      }
      /**
       * Adds event listeners to the socket
       *
       * @private
       */
      addEventListeners() {
        this.ws.onopen = () => {
          if (this.opts.autoUnref) {
            this.ws._socket.unref();
          }
          this.onOpen();
        };
        this.ws.onclose = (closeEvent) => this.onClose({
          description: "websocket connection closed",
          context: closeEvent
        });
        this.ws.onmessage = (ev) => this.onData(ev.data);
        this.ws.onerror = (e) => this.onError("websocket error", e);
      }
      write(packets) {
        this.writable = false;
        for (let i = 0; i < packets.length; i++) {
          const packet = packets[i];
          const lastPacket = i === packets.length - 1;
          encodePacket(packet, this.supportsBinary, (data) => {
            try {
              this.doWrite(packet, data);
            } catch (e) {
            }
            if (lastPacket) {
              nextTick(() => {
                this.writable = true;
                this.emitReserved("drain");
              }, this.setTimeoutFn);
            }
          });
        }
      }
      doClose() {
        if (typeof this.ws !== "undefined") {
          this.ws.onerror = () => {
          };
          this.ws.close();
          this.ws = null;
        }
      }
      /**
       * Generates uri for connection.
       *
       * @private
       */
      uri() {
        const schema = this.opts.secure ? "wss" : "ws";
        const query = this.query || {};
        if (this.opts.timestampRequests) {
          query[this.opts.timestampParam] = randomString();
        }
        if (!this.supportsBinary) {
          query.b64 = 1;
        }
        return this.createUri(schema, query);
      }
    };
    WebSocketCtor = globalThisShim.WebSocket || globalThisShim.MozWebSocket;
    WS = class extends BaseWS {
      createSocket(uri, protocols, opts) {
        return !isReactNative ? protocols ? new WebSocketCtor(uri, protocols) : new WebSocketCtor(uri) : new WebSocketCtor(uri, protocols, opts);
      }
      doWrite(_packet, data) {
        this.ws.send(data);
      }
    };
  }
});

// node_modules/engine.io-client/build/esm/transports/webtransport.js
var WT;
var init_webtransport = __esm({
  "node_modules/engine.io-client/build/esm/transports/webtransport.js"() {
    init_transport();
    init_globals();
    init_esm();
    WT = class extends Transport {
      get name() {
        return "webtransport";
      }
      doOpen() {
        try {
          this._transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name]);
        } catch (err) {
          return this.emitReserved("error", err);
        }
        this._transport.closed.then(() => {
          this.onClose();
        }).catch((err) => {
          this.onError("webtransport error", err);
        });
        this._transport.ready.then(() => {
          this._transport.createBidirectionalStream().then((stream) => {
            const decoderStream = createPacketDecoderStream(Number.MAX_SAFE_INTEGER, this.socket.binaryType);
            const reader = stream.readable.pipeThrough(decoderStream).getReader();
            const encoderStream = createPacketEncoderStream();
            encoderStream.readable.pipeTo(stream.writable);
            this._writer = encoderStream.writable.getWriter();
            const read = () => {
              reader.read().then(({ done, value: value2 }) => {
                if (done) {
                  return;
                }
                this.onPacket(value2);
                read();
              }).catch((err) => {
              });
            };
            read();
            const packet = { type: "open" };
            if (this.query.sid) {
              packet.data = `{"sid":"${this.query.sid}"}`;
            }
            this._writer.write(packet).then(() => this.onOpen());
          });
        });
      }
      write(packets) {
        this.writable = false;
        for (let i = 0; i < packets.length; i++) {
          const packet = packets[i];
          const lastPacket = i === packets.length - 1;
          this._writer.write(packet).then(() => {
            if (lastPacket) {
              nextTick(() => {
                this.writable = true;
                this.emitReserved("drain");
              }, this.setTimeoutFn);
            }
          });
        }
      }
      doClose() {
        var _a;
        (_a = this._transport) === null || _a === void 0 ? void 0 : _a.close();
      }
    };
  }
});

// node_modules/engine.io-client/build/esm/transports/index.js
var transports;
var init_transports = __esm({
  "node_modules/engine.io-client/build/esm/transports/index.js"() {
    init_polling_xhr();
    init_websocket();
    init_webtransport();
    transports = {
      websocket: WS,
      webtransport: WT,
      polling: XHR
    };
  }
});

// node_modules/engine.io-client/build/esm/contrib/parseuri.js
function parse(str) {
  if (str.length > 8e3) {
    throw "URI too long";
  }
  const src = str, b = str.indexOf("["), e = str.indexOf("]");
  if (b != -1 && e != -1) {
    str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ";") + str.substring(e, str.length);
  }
  let m = re.exec(str || ""), uri = {}, i = 14;
  while (i--) {
    uri[parts[i]] = m[i] || "";
  }
  if (b != -1 && e != -1) {
    uri.source = src;
    uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ":");
    uri.authority = uri.authority.replace("[", "").replace("]", "").replace(/;/g, ":");
    uri.ipv6uri = true;
  }
  uri.pathNames = pathNames(uri, uri["path"]);
  uri.queryKey = queryKey(uri, uri["query"]);
  return uri;
}
function pathNames(obj, path) {
  const regx = /\/{2,9}/g, names = path.replace(regx, "/").split("/");
  if (path.slice(0, 1) == "/" || path.length === 0) {
    names.splice(0, 1);
  }
  if (path.slice(-1) == "/") {
    names.splice(names.length - 1, 1);
  }
  return names;
}
function queryKey(uri, query) {
  const data = {};
  query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function($0, $1, $2) {
    if ($1) {
      data[$1] = $2;
    }
  });
  return data;
}
var re, parts;
var init_parseuri = __esm({
  "node_modules/engine.io-client/build/esm/contrib/parseuri.js"() {
    re = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
    parts = [
      "source",
      "protocol",
      "authority",
      "userInfo",
      "user",
      "password",
      "host",
      "port",
      "relative",
      "path",
      "directory",
      "file",
      "query",
      "anchor"
    ];
  }
});

// node_modules/engine.io-client/build/esm/socket.js
var withEventListeners, OFFLINE_EVENT_LISTENERS, SocketWithoutUpgrade, SocketWithUpgrade, Socket;
var init_socket = __esm({
  "node_modules/engine.io-client/build/esm/socket.js"() {
    init_transports();
    init_util();
    init_parseqs();
    init_parseuri();
    init_esm2();
    init_esm();
    init_globals();
    withEventListeners = typeof addEventListener === "function" && typeof removeEventListener === "function";
    OFFLINE_EVENT_LISTENERS = [];
    if (withEventListeners) {
      addEventListener("offline", () => {
        OFFLINE_EVENT_LISTENERS.forEach((listener) => listener());
      }, false);
    }
    SocketWithoutUpgrade = class _SocketWithoutUpgrade extends Emitter {
      /**
       * Socket constructor.
       *
       * @param {String|Object} uri - uri or options
       * @param {Object} opts - options
       */
      constructor(uri, opts) {
        super();
        this.binaryType = defaultBinaryType;
        this.writeBuffer = [];
        this._prevBufferLen = 0;
        this._pingInterval = -1;
        this._pingTimeout = -1;
        this._maxPayload = -1;
        this._pingTimeoutTime = Infinity;
        if (uri && "object" === typeof uri) {
          opts = uri;
          uri = null;
        }
        if (uri) {
          const parsedUri = parse(uri);
          opts.hostname = parsedUri.host;
          opts.secure = parsedUri.protocol === "https" || parsedUri.protocol === "wss";
          opts.port = parsedUri.port;
          if (parsedUri.query)
            opts.query = parsedUri.query;
        } else if (opts.host) {
          opts.hostname = parse(opts.host).host;
        }
        installTimerFunctions(this, opts);
        this.secure = null != opts.secure ? opts.secure : typeof location !== "undefined" && "https:" === location.protocol;
        if (opts.hostname && !opts.port) {
          opts.port = this.secure ? "443" : "80";
        }
        this.hostname = opts.hostname || (typeof location !== "undefined" ? location.hostname : "localhost");
        this.port = opts.port || (typeof location !== "undefined" && location.port ? location.port : this.secure ? "443" : "80");
        this.transports = [];
        this._transportsByName = {};
        opts.transports.forEach((t) => {
          const transportName = t.prototype.name;
          this.transports.push(transportName);
          this._transportsByName[transportName] = t;
        });
        this.opts = Object.assign({
          path: "/engine.io",
          agent: false,
          withCredentials: false,
          upgrade: true,
          timestampParam: "t",
          rememberUpgrade: false,
          addTrailingSlash: true,
          rejectUnauthorized: true,
          perMessageDeflate: {
            threshold: 1024
          },
          transportOptions: {},
          closeOnBeforeunload: false
        }, opts);
        this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : "");
        if (typeof this.opts.query === "string") {
          this.opts.query = decode2(this.opts.query);
        }
        if (withEventListeners) {
          if (this.opts.closeOnBeforeunload) {
            this._beforeunloadEventListener = () => {
              if (this.transport) {
                this.transport.removeAllListeners();
                this.transport.close();
              }
            };
            addEventListener("beforeunload", this._beforeunloadEventListener, false);
          }
          if (this.hostname !== "localhost") {
            this._offlineEventListener = () => {
              this._onClose("transport close", {
                description: "network connection lost"
              });
            };
            OFFLINE_EVENT_LISTENERS.push(this._offlineEventListener);
          }
        }
        if (this.opts.withCredentials) {
          this._cookieJar = createCookieJar();
        }
        this._open();
      }
      /**
       * Creates transport of the given type.
       *
       * @param {String} name - transport name
       * @return {Transport}
       * @private
       */
      createTransport(name) {
        const query = Object.assign({}, this.opts.query);
        query.EIO = protocol;
        query.transport = name;
        if (this.id)
          query.sid = this.id;
        const opts = Object.assign({}, this.opts, {
          query,
          socket: this,
          hostname: this.hostname,
          secure: this.secure,
          port: this.port
        }, this.opts.transportOptions[name]);
        return new this._transportsByName[name](opts);
      }
      /**
       * Initializes transport to use and starts probe.
       *
       * @private
       */
      _open() {
        if (this.transports.length === 0) {
          this.setTimeoutFn(() => {
            this.emitReserved("error", "No transports available");
          }, 0);
          return;
        }
        const transportName = this.opts.rememberUpgrade && _SocketWithoutUpgrade.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1 ? "websocket" : this.transports[0];
        this.readyState = "opening";
        const transport = this.createTransport(transportName);
        transport.open();
        this.setTransport(transport);
      }
      /**
       * Sets the current transport. Disables the existing one (if any).
       *
       * @private
       */
      setTransport(transport) {
        if (this.transport) {
          this.transport.removeAllListeners();
        }
        this.transport = transport;
        transport.on("drain", this._onDrain.bind(this)).on("packet", this._onPacket.bind(this)).on("error", this._onError.bind(this)).on("close", (reason) => this._onClose("transport close", reason));
      }
      /**
       * Called when connection is deemed open.
       *
       * @private
       */
      onOpen() {
        this.readyState = "open";
        _SocketWithoutUpgrade.priorWebsocketSuccess = "websocket" === this.transport.name;
        this.emitReserved("open");
        this.flush();
      }
      /**
       * Handles a packet.
       *
       * @private
       */
      _onPacket(packet) {
        if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
          this.emitReserved("packet", packet);
          this.emitReserved("heartbeat");
          switch (packet.type) {
            case "open":
              this.onHandshake(JSON.parse(packet.data));
              break;
            case "ping":
              this._sendPacket("pong");
              this.emitReserved("ping");
              this.emitReserved("pong");
              this._resetPingTimeout();
              break;
            case "error":
              const err = new Error("server error");
              err.code = packet.data;
              this._onError(err);
              break;
            case "message":
              this.emitReserved("data", packet.data);
              this.emitReserved("message", packet.data);
              break;
          }
        } else {
        }
      }
      /**
       * Called upon handshake completion.
       *
       * @param {Object} data - handshake obj
       * @private
       */
      onHandshake(data) {
        this.emitReserved("handshake", data);
        this.id = data.sid;
        this.transport.query.sid = data.sid;
        this._pingInterval = data.pingInterval;
        this._pingTimeout = data.pingTimeout;
        this._maxPayload = data.maxPayload;
        this.onOpen();
        if ("closed" === this.readyState)
          return;
        this._resetPingTimeout();
      }
      /**
       * Sets and resets ping timeout timer based on server pings.
       *
       * @private
       */
      _resetPingTimeout() {
        this.clearTimeoutFn(this._pingTimeoutTimer);
        const delay = this._pingInterval + this._pingTimeout;
        this._pingTimeoutTime = Date.now() + delay;
        this._pingTimeoutTimer = this.setTimeoutFn(() => {
          this._onClose("ping timeout");
        }, delay);
        if (this.opts.autoUnref) {
          this._pingTimeoutTimer.unref();
        }
      }
      /**
       * Called on `drain` event
       *
       * @private
       */
      _onDrain() {
        this.writeBuffer.splice(0, this._prevBufferLen);
        this._prevBufferLen = 0;
        if (0 === this.writeBuffer.length) {
          this.emitReserved("drain");
        } else {
          this.flush();
        }
      }
      /**
       * Flush write buffers.
       *
       * @private
       */
      flush() {
        if ("closed" !== this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
          const packets = this._getWritablePackets();
          this.transport.send(packets);
          this._prevBufferLen = packets.length;
          this.emitReserved("flush");
        }
      }
      /**
       * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
       * long-polling)
       *
       * @private
       */
      _getWritablePackets() {
        const shouldCheckPayloadSize = this._maxPayload && this.transport.name === "polling" && this.writeBuffer.length > 1;
        if (!shouldCheckPayloadSize) {
          return this.writeBuffer;
        }
        let payloadSize = 1;
        for (let i = 0; i < this.writeBuffer.length; i++) {
          const data = this.writeBuffer[i].data;
          if (data) {
            payloadSize += byteLength(data);
          }
          if (i > 0 && payloadSize > this._maxPayload) {
            return this.writeBuffer.slice(0, i);
          }
          payloadSize += 2;
        }
        return this.writeBuffer;
      }
      /**
       * Checks whether the heartbeat timer has expired but the socket has not yet been notified.
       *
       * Note: this method is private for now because it does not really fit the WebSocket API, but if we put it in the
       * `write()` method then the message would not be buffered by the Socket.IO client.
       *
       * @return {boolean}
       * @private
       */
      /* private */
      _hasPingExpired() {
        if (!this._pingTimeoutTime)
          return true;
        const hasExpired = Date.now() > this._pingTimeoutTime;
        if (hasExpired) {
          this._pingTimeoutTime = 0;
          nextTick(() => {
            this._onClose("ping timeout");
          }, this.setTimeoutFn);
        }
        return hasExpired;
      }
      /**
       * Sends a message.
       *
       * @param {String} msg - message.
       * @param {Object} options.
       * @param {Function} fn - callback function.
       * @return {Socket} for chaining.
       */
      write(msg, options, fn) {
        this._sendPacket("message", msg, options, fn);
        return this;
      }
      /**
       * Sends a message. Alias of {@link Socket#write}.
       *
       * @param {String} msg - message.
       * @param {Object} options.
       * @param {Function} fn - callback function.
       * @return {Socket} for chaining.
       */
      send(msg, options, fn) {
        this._sendPacket("message", msg, options, fn);
        return this;
      }
      /**
       * Sends a packet.
       *
       * @param {String} type - packet type.
       * @param {String} data.
       * @param {Object} options.
       * @param {Function} fn - callback function.
       * @private
       */
      _sendPacket(type, data, options, fn) {
        if ("function" === typeof data) {
          fn = data;
          data = void 0;
        }
        if ("function" === typeof options) {
          fn = options;
          options = null;
        }
        if ("closing" === this.readyState || "closed" === this.readyState) {
          return;
        }
        options = options || {};
        options.compress = false !== options.compress;
        const packet = {
          type,
          data,
          options
        };
        this.emitReserved("packetCreate", packet);
        this.writeBuffer.push(packet);
        if (fn)
          this.once("flush", fn);
        this.flush();
      }
      /**
       * Closes the connection.
       */
      close() {
        const close = () => {
          this._onClose("forced close");
          this.transport.close();
        };
        const cleanupAndClose = () => {
          this.off("upgrade", cleanupAndClose);
          this.off("upgradeError", cleanupAndClose);
          close();
        };
        const waitForUpgrade = () => {
          this.once("upgrade", cleanupAndClose);
          this.once("upgradeError", cleanupAndClose);
        };
        if ("opening" === this.readyState || "open" === this.readyState) {
          this.readyState = "closing";
          if (this.writeBuffer.length) {
            this.once("drain", () => {
              if (this.upgrading) {
                waitForUpgrade();
              } else {
                close();
              }
            });
          } else if (this.upgrading) {
            waitForUpgrade();
          } else {
            close();
          }
        }
        return this;
      }
      /**
       * Called upon transport error
       *
       * @private
       */
      _onError(err) {
        _SocketWithoutUpgrade.priorWebsocketSuccess = false;
        if (this.opts.tryAllTransports && this.transports.length > 1 && this.readyState === "opening") {
          this.transports.shift();
          return this._open();
        }
        this.emitReserved("error", err);
        this._onClose("transport error", err);
      }
      /**
       * Called upon transport close.
       *
       * @private
       */
      _onClose(reason, description) {
        if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
          this.clearTimeoutFn(this._pingTimeoutTimer);
          this.transport.removeAllListeners("close");
          this.transport.close();
          this.transport.removeAllListeners();
          if (withEventListeners) {
            if (this._beforeunloadEventListener) {
              removeEventListener("beforeunload", this._beforeunloadEventListener, false);
            }
            if (this._offlineEventListener) {
              const i = OFFLINE_EVENT_LISTENERS.indexOf(this._offlineEventListener);
              if (i !== -1) {
                OFFLINE_EVENT_LISTENERS.splice(i, 1);
              }
            }
          }
          this.readyState = "closed";
          this.id = null;
          this.emitReserved("close", reason, description);
          this.writeBuffer = [];
          this._prevBufferLen = 0;
        }
      }
    };
    SocketWithoutUpgrade.protocol = protocol;
    SocketWithUpgrade = class extends SocketWithoutUpgrade {
      constructor() {
        super(...arguments);
        this._upgrades = [];
      }
      onOpen() {
        super.onOpen();
        if ("open" === this.readyState && this.opts.upgrade) {
          for (let i = 0; i < this._upgrades.length; i++) {
            this._probe(this._upgrades[i]);
          }
        }
      }
      /**
       * Probes a transport.
       *
       * @param {String} name - transport name
       * @private
       */
      _probe(name) {
        let transport = this.createTransport(name);
        let failed = false;
        SocketWithoutUpgrade.priorWebsocketSuccess = false;
        const onTransportOpen = () => {
          if (failed)
            return;
          transport.send([{ type: "ping", data: "probe" }]);
          transport.once("packet", (msg) => {
            if (failed)
              return;
            if ("pong" === msg.type && "probe" === msg.data) {
              this.upgrading = true;
              this.emitReserved("upgrading", transport);
              if (!transport)
                return;
              SocketWithoutUpgrade.priorWebsocketSuccess = "websocket" === transport.name;
              this.transport.pause(() => {
                if (failed)
                  return;
                if ("closed" === this.readyState)
                  return;
                cleanup();
                this.setTransport(transport);
                transport.send([{ type: "upgrade" }]);
                this.emitReserved("upgrade", transport);
                transport = null;
                this.upgrading = false;
                this.flush();
              });
            } else {
              const err = new Error("probe error");
              err.transport = transport.name;
              this.emitReserved("upgradeError", err);
            }
          });
        };
        function freezeTransport() {
          if (failed)
            return;
          failed = true;
          cleanup();
          transport.close();
          transport = null;
        }
        const onerror = (err) => {
          const error = new Error("probe error: " + err);
          error.transport = transport.name;
          freezeTransport();
          this.emitReserved("upgradeError", error);
        };
        function onTransportClose() {
          onerror("transport closed");
        }
        function onclose() {
          onerror("socket closed");
        }
        function onupgrade(to) {
          if (transport && to.name !== transport.name) {
            freezeTransport();
          }
        }
        const cleanup = () => {
          transport.removeListener("open", onTransportOpen);
          transport.removeListener("error", onerror);
          transport.removeListener("close", onTransportClose);
          this.off("close", onclose);
          this.off("upgrading", onupgrade);
        };
        transport.once("open", onTransportOpen);
        transport.once("error", onerror);
        transport.once("close", onTransportClose);
        this.once("close", onclose);
        this.once("upgrading", onupgrade);
        if (this._upgrades.indexOf("webtransport") !== -1 && name !== "webtransport") {
          this.setTimeoutFn(() => {
            if (!failed) {
              transport.open();
            }
          }, 200);
        } else {
          transport.open();
        }
      }
      onHandshake(data) {
        this._upgrades = this._filterUpgrades(data.upgrades);
        super.onHandshake(data);
      }
      /**
       * Filters upgrades, returning only those matching client transports.
       *
       * @param {Array} upgrades - server upgrades
       * @private
       */
      _filterUpgrades(upgrades) {
        const filteredUpgrades = [];
        for (let i = 0; i < upgrades.length; i++) {
          if (~this.transports.indexOf(upgrades[i]))
            filteredUpgrades.push(upgrades[i]);
        }
        return filteredUpgrades;
      }
    };
    Socket = class extends SocketWithUpgrade {
      constructor(uri, opts = {}) {
        const isOptionsOnly = typeof uri === "object";
        const o = isOptionsOnly ? { ...uri } : { ...opts };
        if (!o.transports || o.transports && typeof o.transports[0] === "string") {
          o.transports = (o.transports || ["polling", "websocket", "webtransport"]).map((transportName) => transports[transportName]).filter((t) => !!t);
        }
        super(isOptionsOnly ? o : uri, o);
      }
    };
  }
});

// node_modules/engine.io-client/build/esm/transports/polling-fetch.js
var Fetch;
var init_polling_fetch = __esm({
  "node_modules/engine.io-client/build/esm/transports/polling-fetch.js"() {
    init_polling();
    Fetch = class extends Polling {
      doPoll() {
        this._fetch().then((res) => {
          if (!res.ok) {
            return this.onError("fetch read error", res.status, res);
          }
          res.text().then((data) => this.onData(data));
        }).catch((err) => {
          this.onError("fetch read error", err);
        });
      }
      doWrite(data, callback) {
        this._fetch(data).then((res) => {
          if (!res.ok) {
            return this.onError("fetch write error", res.status, res);
          }
          callback();
        }).catch((err) => {
          this.onError("fetch write error", err);
        });
      }
      _fetch(data) {
        var _a;
        const isPost = data !== void 0;
        const headers = new Headers(this.opts.extraHeaders);
        if (isPost) {
          headers.set("content-type", "text/plain;charset=UTF-8");
        }
        (_a = this.socket._cookieJar) === null || _a === void 0 ? void 0 : _a.appendCookies(headers);
        return fetch(this.uri(), {
          method: isPost ? "POST" : "GET",
          body: isPost ? data : null,
          headers,
          credentials: this.opts.withCredentials ? "include" : "omit"
        }).then((res) => {
          var _a2;
          (_a2 = this.socket._cookieJar) === null || _a2 === void 0 ? void 0 : _a2.parseCookies(res.headers.getSetCookie());
          return res;
        });
      }
    };
  }
});

// node_modules/engine.io-client/build/esm/index.js
var protocol2;
var init_esm3 = __esm({
  "node_modules/engine.io-client/build/esm/index.js"() {
    init_socket();
    init_socket();
    init_transport();
    init_transports();
    init_util();
    init_parseuri();
    init_globals();
    init_polling_fetch();
    init_polling_xhr();
    init_polling_xhr();
    init_websocket();
    init_websocket();
    init_webtransport();
    protocol2 = Socket.protocol;
  }
});

// node_modules/socket.io-client/build/esm/url.js
function url(uri, path = "", loc) {
  let obj = uri;
  loc = loc || typeof location !== "undefined" && location;
  if (null == uri)
    uri = loc.protocol + "//" + loc.host;
  if (typeof uri === "string") {
    if ("/" === uri.charAt(0)) {
      if ("/" === uri.charAt(1)) {
        uri = loc.protocol + uri;
      } else {
        uri = loc.host + uri;
      }
    }
    if (!/^(https?|wss?):\/\//.test(uri)) {
      if ("undefined" !== typeof loc) {
        uri = loc.protocol + "//" + uri;
      } else {
        uri = "https://" + uri;
      }
    }
    obj = parse(uri);
  }
  if (!obj.port) {
    if (/^(http|ws)$/.test(obj.protocol)) {
      obj.port = "80";
    } else if (/^(http|ws)s$/.test(obj.protocol)) {
      obj.port = "443";
    }
  }
  obj.path = obj.path || "/";
  const ipv6 = obj.host.indexOf(":") !== -1;
  const host = ipv6 ? "[" + obj.host + "]" : obj.host;
  obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
  obj.href = obj.protocol + "://" + host + (loc && loc.port === obj.port ? "" : ":" + obj.port);
  return obj;
}
var init_url = __esm({
  "node_modules/socket.io-client/build/esm/url.js"() {
    init_esm3();
  }
});

// node_modules/socket.io-parser/build/esm/is-binary.js
function isBinary(obj) {
  return withNativeArrayBuffer3 && (obj instanceof ArrayBuffer || isView2(obj)) || withNativeBlob2 && obj instanceof Blob || withNativeFile && obj instanceof File;
}
function hasBinary(obj, toJSON) {
  if (!obj || typeof obj !== "object") {
    return false;
  }
  if (Array.isArray(obj)) {
    for (let i = 0, l = obj.length; i < l; i++) {
      if (hasBinary(obj[i])) {
        return true;
      }
    }
    return false;
  }
  if (isBinary(obj)) {
    return true;
  }
  if (obj.toJSON && typeof obj.toJSON === "function" && arguments.length === 1) {
    return hasBinary(obj.toJSON(), true);
  }
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
      return true;
    }
  }
  return false;
}
var withNativeArrayBuffer3, isView2, toString, withNativeBlob2, withNativeFile;
var init_is_binary = __esm({
  "node_modules/socket.io-parser/build/esm/is-binary.js"() {
    withNativeArrayBuffer3 = typeof ArrayBuffer === "function";
    isView2 = (obj) => {
      return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj.buffer instanceof ArrayBuffer;
    };
    toString = Object.prototype.toString;
    withNativeBlob2 = typeof Blob === "function" || typeof Blob !== "undefined" && toString.call(Blob) === "[object BlobConstructor]";
    withNativeFile = typeof File === "function" || typeof File !== "undefined" && toString.call(File) === "[object FileConstructor]";
  }
});

// node_modules/socket.io-parser/build/esm/binary.js
function deconstructPacket(packet) {
  const buffers = [];
  const packetData = packet.data;
  const pack = packet;
  pack.data = _deconstructPacket(packetData, buffers);
  pack.attachments = buffers.length;
  return { packet: pack, buffers };
}
function _deconstructPacket(data, buffers, toJSON) {
  if (!data)
    return data;
  if (isBinary(data)) {
    const placeholder = { _placeholder: true, num: buffers.length };
    buffers.push(data);
    return placeholder;
  } else if (Array.isArray(data)) {
    const newData = new Array(data.length);
    for (let i = 0; i < data.length; i++) {
      newData[i] = _deconstructPacket(data[i], buffers);
    }
    return newData;
  } else if (typeof data === "object" && !(data instanceof Date)) {
    if (data.toJSON && typeof data.toJSON === "function" && !toJSON) {
      return _deconstructPacket(data.toJSON(), buffers, true);
    }
    const newData = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        newData[key] = _deconstructPacket(data[key], buffers);
      }
    }
    return newData;
  }
  return data;
}
function reconstructPacket(packet, buffers) {
  packet.data = _reconstructPacket(packet.data, buffers);
  delete packet.attachments;
  return packet;
}
function _reconstructPacket(data, buffers) {
  if (!data)
    return data;
  if (data && data._placeholder === true) {
    const isIndexValid = typeof data.num === "number" && data.num >= 0 && data.num < buffers.length;
    if (isIndexValid) {
      return buffers[data.num];
    } else {
      throw new Error("illegal attachments");
    }
  } else if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      data[i] = _reconstructPacket(data[i], buffers);
    }
  } else if (typeof data === "object") {
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        data[key] = _reconstructPacket(data[key], buffers);
      }
    }
  }
  return data;
}
var init_binary = __esm({
  "node_modules/socket.io-parser/build/esm/binary.js"() {
    init_is_binary();
  }
});

// node_modules/socket.io-parser/build/esm/index.js
var esm_exports = {};
__export(esm_exports, {
  Decoder: () => Decoder,
  Encoder: () => Encoder,
  PacketType: () => PacketType,
  isPacketValid: () => isPacketValid,
  protocol: () => protocol3
});
function isNamespaceValid(nsp) {
  return typeof nsp === "string";
}
function isAckIdValid(id) {
  return id === void 0 || isInteger(id);
}
function isObject(value2) {
  return Object.prototype.toString.call(value2) === "[object Object]";
}
function isDataValid(type, payload) {
  switch (type) {
    case PacketType.CONNECT:
      return payload === void 0 || isObject(payload);
    case PacketType.DISCONNECT:
      return payload === void 0;
    case PacketType.EVENT:
      return Array.isArray(payload) && (typeof payload[0] === "number" || typeof payload[0] === "string" && RESERVED_EVENTS.indexOf(payload[0]) === -1);
    case PacketType.ACK:
      return Array.isArray(payload);
    case PacketType.CONNECT_ERROR:
      return typeof payload === "string" || isObject(payload);
    default:
      return false;
  }
}
function isPacketValid(packet) {
  return isNamespaceValid(packet.nsp) && isAckIdValid(packet.id) && isDataValid(packet.type, packet.data);
}
var RESERVED_EVENTS, protocol3, PacketType, Encoder, Decoder, BinaryReconstructor, isInteger;
var init_esm4 = __esm({
  "node_modules/socket.io-parser/build/esm/index.js"() {
    init_esm2();
    init_binary();
    init_is_binary();
    RESERVED_EVENTS = [
      "connect",
      // used on the client side
      "connect_error",
      // used on the client side
      "disconnect",
      // used on both sides
      "disconnecting",
      // used on the server side
      "newListener",
      // used by the Node.js EventEmitter
      "removeListener"
      // used by the Node.js EventEmitter
    ];
    protocol3 = 5;
    (function(PacketType2) {
      PacketType2[PacketType2["CONNECT"] = 0] = "CONNECT";
      PacketType2[PacketType2["DISCONNECT"] = 1] = "DISCONNECT";
      PacketType2[PacketType2["EVENT"] = 2] = "EVENT";
      PacketType2[PacketType2["ACK"] = 3] = "ACK";
      PacketType2[PacketType2["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
      PacketType2[PacketType2["BINARY_EVENT"] = 5] = "BINARY_EVENT";
      PacketType2[PacketType2["BINARY_ACK"] = 6] = "BINARY_ACK";
    })(PacketType || (PacketType = {}));
    Encoder = class {
      /**
       * Encoder constructor
       *
       * @param {function} replacer - custom replacer to pass down to JSON.parse
       */
      constructor(replacer) {
        this.replacer = replacer;
      }
      /**
       * Encode a packet as a single string if non-binary, or as a
       * buffer sequence, depending on packet type.
       *
       * @param {Object} obj - packet object
       */
      encode(obj) {
        if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
          if (hasBinary(obj)) {
            return this.encodeAsBinary({
              type: obj.type === PacketType.EVENT ? PacketType.BINARY_EVENT : PacketType.BINARY_ACK,
              nsp: obj.nsp,
              data: obj.data,
              id: obj.id
            });
          }
        }
        return [this.encodeAsString(obj)];
      }
      /**
       * Encode packet as string.
       */
      encodeAsString(obj) {
        let str = "" + obj.type;
        if (obj.type === PacketType.BINARY_EVENT || obj.type === PacketType.BINARY_ACK) {
          str += obj.attachments + "-";
        }
        if (obj.nsp && "/" !== obj.nsp) {
          str += obj.nsp + ",";
        }
        if (null != obj.id) {
          str += obj.id;
        }
        if (null != obj.data) {
          str += JSON.stringify(obj.data, this.replacer);
        }
        return str;
      }
      /**
       * Encode packet as 'buffer sequence' by removing blobs, and
       * deconstructing packet into object with placeholders and
       * a list of buffers.
       */
      encodeAsBinary(obj) {
        const deconstruction = deconstructPacket(obj);
        const pack = this.encodeAsString(deconstruction.packet);
        const buffers = deconstruction.buffers;
        buffers.unshift(pack);
        return buffers;
      }
    };
    Decoder = class _Decoder extends Emitter {
      /**
       * Decoder constructor
       */
      constructor(opts) {
        super();
        this.opts = Object.assign({
          reviver: void 0,
          maxAttachments: 10
        }, typeof opts === "function" ? { reviver: opts } : opts);
      }
      /**
       * Decodes an encoded packet string into packet JSON.
       *
       * @param {String} obj - encoded packet
       */
      add(obj) {
        let packet;
        if (typeof obj === "string") {
          if (this.reconstructor) {
            throw new Error("got plaintext data when reconstructing a packet");
          }
          packet = this.decodeString(obj);
          const isBinaryEvent = packet.type === PacketType.BINARY_EVENT;
          if (isBinaryEvent || packet.type === PacketType.BINARY_ACK) {
            packet.type = isBinaryEvent ? PacketType.EVENT : PacketType.ACK;
            this.reconstructor = new BinaryReconstructor(packet);
          } else {
            super.emitReserved("decoded", packet);
          }
        } else if (isBinary(obj) || obj.base64) {
          if (!this.reconstructor) {
            throw new Error("got binary data when not reconstructing a packet");
          } else {
            packet = this.reconstructor.takeBinaryData(obj);
            if (packet) {
              this.reconstructor = null;
              super.emitReserved("decoded", packet);
            }
          }
        } else {
          throw new Error("Unknown type: " + obj);
        }
      }
      /**
       * Decode a packet String (JSON data)
       *
       * @param {String} str
       * @return {Object} packet
       */
      decodeString(str) {
        let i = 0;
        const p = {
          type: Number(str.charAt(0))
        };
        if (PacketType[p.type] === void 0) {
          throw new Error("unknown packet type " + p.type);
        }
        if (p.type === PacketType.BINARY_EVENT || p.type === PacketType.BINARY_ACK) {
          const start = i + 1;
          while (str.charAt(++i) !== "-" && i != str.length) {
          }
          const buf = str.substring(start, i);
          if (buf != Number(buf) || str.charAt(i) !== "-") {
            throw new Error("Illegal attachments");
          }
          const n = Number(buf);
          if (!isInteger(n) || n < 1) {
            throw new Error("Illegal attachments");
          } else if (n > this.opts.maxAttachments) {
            throw new Error("too many attachments");
          }
          p.attachments = n;
        }
        if ("/" === str.charAt(i + 1)) {
          const start = i + 1;
          while (++i) {
            const c = str.charAt(i);
            if ("," === c)
              break;
            if (i === str.length)
              break;
          }
          p.nsp = str.substring(start, i);
        } else {
          p.nsp = "/";
        }
        const next = str.charAt(i + 1);
        if ("" !== next && Number(next) == next) {
          const start = i + 1;
          while (++i) {
            const c = str.charAt(i);
            if (null == c || Number(c) != c) {
              --i;
              break;
            }
            if (i === str.length)
              break;
          }
          p.id = Number(str.substring(start, i + 1));
        }
        if (str.charAt(++i)) {
          const payload = this.tryParse(str.substr(i));
          if (_Decoder.isPayloadValid(p.type, payload)) {
            p.data = payload;
          } else {
            throw new Error("invalid payload");
          }
        }
        return p;
      }
      tryParse(str) {
        try {
          return JSON.parse(str, this.opts.reviver);
        } catch (e) {
          return false;
        }
      }
      static isPayloadValid(type, payload) {
        switch (type) {
          case PacketType.CONNECT:
            return isObject(payload);
          case PacketType.DISCONNECT:
            return payload === void 0;
          case PacketType.CONNECT_ERROR:
            return typeof payload === "string" || isObject(payload);
          case PacketType.EVENT:
          case PacketType.BINARY_EVENT:
            return Array.isArray(payload) && (typeof payload[0] === "number" || typeof payload[0] === "string" && RESERVED_EVENTS.indexOf(payload[0]) === -1);
          case PacketType.ACK:
          case PacketType.BINARY_ACK:
            return Array.isArray(payload);
        }
      }
      /**
       * Deallocates a parser's resources
       */
      destroy() {
        if (this.reconstructor) {
          this.reconstructor.finishedReconstruction();
          this.reconstructor = null;
        }
      }
    };
    BinaryReconstructor = class {
      constructor(packet) {
        this.packet = packet;
        this.buffers = [];
        this.reconPack = packet;
      }
      /**
       * Method to be called when binary data received from connection
       * after a BINARY_EVENT packet.
       *
       * @param {Buffer | ArrayBuffer} binData - the raw binary data received
       * @return {null | Object} returns null if more binary data is expected or
       *   a reconstructed packet object if all buffers have been received.
       */
      takeBinaryData(binData) {
        this.buffers.push(binData);
        if (this.buffers.length === this.reconPack.attachments) {
          const packet = reconstructPacket(this.reconPack, this.buffers);
          this.finishedReconstruction();
          return packet;
        }
        return null;
      }
      /**
       * Cleans up binary packet reconstruction variables.
       */
      finishedReconstruction() {
        this.reconPack = null;
        this.buffers = [];
      }
    };
    isInteger = Number.isInteger || function(value2) {
      return typeof value2 === "number" && isFinite(value2) && Math.floor(value2) === value2;
    };
  }
});

// node_modules/socket.io-client/build/esm/on.js
function on(obj, ev, fn) {
  obj.on(ev, fn);
  return function subDestroy() {
    obj.off(ev, fn);
  };
}
var init_on = __esm({
  "node_modules/socket.io-client/build/esm/on.js"() {
  }
});

// node_modules/socket.io-client/build/esm/socket.js
var RESERVED_EVENTS2, Socket2;
var init_socket2 = __esm({
  "node_modules/socket.io-client/build/esm/socket.js"() {
    init_esm4();
    init_on();
    init_esm2();
    RESERVED_EVENTS2 = Object.freeze({
      connect: 1,
      connect_error: 1,
      disconnect: 1,
      disconnecting: 1,
      // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
      newListener: 1,
      removeListener: 1
    });
    Socket2 = class extends Emitter {
      /**
       * `Socket` constructor.
       */
      constructor(io, nsp, opts) {
        super();
        this.connected = false;
        this.recovered = false;
        this.receiveBuffer = [];
        this.sendBuffer = [];
        this._queue = [];
        this._queueSeq = 0;
        this.ids = 0;
        this.acks = {};
        this.flags = {};
        this.io = io;
        this.nsp = nsp;
        if (opts && opts.auth) {
          this.auth = opts.auth;
        }
        this._opts = Object.assign({}, opts);
        if (this.io._autoConnect)
          this.open();
      }
      /**
       * Whether the socket is currently disconnected
       *
       * @example
       * const socket = io();
       *
       * socket.on("connect", () => {
       *   console.log(socket.disconnected); // false
       * });
       *
       * socket.on("disconnect", () => {
       *   console.log(socket.disconnected); // true
       * });
       */
      get disconnected() {
        return !this.connected;
      }
      /**
       * Subscribe to open, close and packet events
       *
       * @private
       */
      subEvents() {
        if (this.subs)
          return;
        const io = this.io;
        this.subs = [
          on(io, "open", this.onopen.bind(this)),
          on(io, "packet", this.onpacket.bind(this)),
          on(io, "error", this.onerror.bind(this)),
          on(io, "close", this.onclose.bind(this))
        ];
      }
      /**
       * Whether the Socket will try to reconnect when its Manager connects or reconnects.
       *
       * @example
       * const socket = io();
       *
       * console.log(socket.active); // true
       *
       * socket.on("disconnect", (reason) => {
       *   if (reason === "io server disconnect") {
       *     // the disconnection was initiated by the server, you need to manually reconnect
       *     console.log(socket.active); // false
       *   }
       *   // else the socket will automatically try to reconnect
       *   console.log(socket.active); // true
       * });
       */
      get active() {
        return !!this.subs;
      }
      /**
       * "Opens" the socket.
       *
       * @example
       * const socket = io({
       *   autoConnect: false
       * });
       *
       * socket.connect();
       */
      connect() {
        if (this.connected)
          return this;
        this.subEvents();
        if (!this.io["_reconnecting"])
          this.io.open();
        if ("open" === this.io._readyState)
          this.onopen();
        return this;
      }
      /**
       * Alias for {@link connect()}.
       */
      open() {
        return this.connect();
      }
      /**
       * Sends a `message` event.
       *
       * This method mimics the WebSocket.send() method.
       *
       * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
       *
       * @example
       * socket.send("hello");
       *
       * // this is equivalent to
       * socket.emit("message", "hello");
       *
       * @return self
       */
      send(...args) {
        args.unshift("message");
        this.emit.apply(this, args);
        return this;
      }
      /**
       * Override `emit`.
       * If the event is in `events`, it's emitted normally.
       *
       * @example
       * socket.emit("hello", "world");
       *
       * // all serializable datastructures are supported (no need to call JSON.stringify)
       * socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
       *
       * // with an acknowledgement from the server
       * socket.emit("hello", "world", (val) => {
       *   // ...
       * });
       *
       * @return self
       */
      emit(ev, ...args) {
        var _a, _b, _c;
        if (RESERVED_EVENTS2.hasOwnProperty(ev)) {
          throw new Error('"' + ev.toString() + '" is a reserved event name');
        }
        args.unshift(ev);
        if (this._opts.retries && !this.flags.fromQueue && !this.flags.volatile) {
          this._addToQueue(args);
          return this;
        }
        const packet = {
          type: PacketType.EVENT,
          data: args
        };
        packet.options = {};
        packet.options.compress = this.flags.compress !== false;
        if ("function" === typeof args[args.length - 1]) {
          const id = this.ids++;
          const ack = args.pop();
          this._registerAckCallback(id, ack);
          packet.id = id;
        }
        const isTransportWritable = (_b = (_a = this.io.engine) === null || _a === void 0 ? void 0 : _a.transport) === null || _b === void 0 ? void 0 : _b.writable;
        const isConnected = this.connected && !((_c = this.io.engine) === null || _c === void 0 ? void 0 : _c._hasPingExpired());
        const discardPacket = this.flags.volatile && !isTransportWritable;
        if (discardPacket) {
        } else if (isConnected) {
          this.notifyOutgoingListeners(packet);
          this.packet(packet);
        } else {
          this.sendBuffer.push(packet);
        }
        this.flags = {};
        return this;
      }
      /**
       * @private
       */
      _registerAckCallback(id, ack) {
        var _a;
        const timeout = (_a = this.flags.timeout) !== null && _a !== void 0 ? _a : this._opts.ackTimeout;
        if (timeout === void 0) {
          this.acks[id] = ack;
          return;
        }
        const timer = this.io.setTimeoutFn(() => {
          delete this.acks[id];
          for (let i = 0; i < this.sendBuffer.length; i++) {
            if (this.sendBuffer[i].id === id) {
              this.sendBuffer.splice(i, 1);
            }
          }
          ack.call(this, new Error("operation has timed out"));
        }, timeout);
        const fn = (...args) => {
          this.io.clearTimeoutFn(timer);
          ack.apply(this, args);
        };
        fn.withError = true;
        this.acks[id] = fn;
      }
      /**
       * Emits an event and waits for an acknowledgement
       *
       * @example
       * // without timeout
       * const response = await socket.emitWithAck("hello", "world");
       *
       * // with a specific timeout
       * try {
       *   const response = await socket.timeout(1000).emitWithAck("hello", "world");
       * } catch (err) {
       *   // the server did not acknowledge the event in the given delay
       * }
       *
       * @return a Promise that will be fulfilled when the server acknowledges the event
       */
      emitWithAck(ev, ...args) {
        return new Promise((resolve, reject) => {
          const fn = (arg1, arg2) => {
            return arg1 ? reject(arg1) : resolve(arg2);
          };
          fn.withError = true;
          args.push(fn);
          this.emit(ev, ...args);
        });
      }
      /**
       * Add the packet to the queue.
       * @param args
       * @private
       */
      _addToQueue(args) {
        let ack;
        if (typeof args[args.length - 1] === "function") {
          ack = args.pop();
        }
        const packet = {
          id: this._queueSeq++,
          tryCount: 0,
          pending: false,
          args,
          flags: Object.assign({ fromQueue: true }, this.flags)
        };
        args.push((err, ...responseArgs) => {
          if (packet !== this._queue[0]) {
          }
          const hasError = err !== null;
          if (hasError) {
            if (packet.tryCount > this._opts.retries) {
              this._queue.shift();
              if (ack) {
                ack(err);
              }
            }
          } else {
            this._queue.shift();
            if (ack) {
              ack(null, ...responseArgs);
            }
          }
          packet.pending = false;
          return this._drainQueue();
        });
        this._queue.push(packet);
        this._drainQueue();
      }
      /**
       * Send the first packet of the queue, and wait for an acknowledgement from the server.
       * @param force - whether to resend a packet that has not been acknowledged yet
       *
       * @private
       */
      _drainQueue(force = false) {
        if (!this.connected || this._queue.length === 0) {
          return;
        }
        const packet = this._queue[0];
        if (packet.pending && !force) {
          return;
        }
        packet.pending = true;
        packet.tryCount++;
        this.flags = packet.flags;
        this.emit.apply(this, packet.args);
      }
      /**
       * Sends a packet.
       *
       * @param packet
       * @private
       */
      packet(packet) {
        packet.nsp = this.nsp;
        this.io._packet(packet);
      }
      /**
       * Called upon engine `open`.
       *
       * @private
       */
      onopen() {
        if (typeof this.auth == "function") {
          this.auth((data) => {
            this._sendConnectPacket(data);
          });
        } else {
          this._sendConnectPacket(this.auth);
        }
      }
      /**
       * Sends a CONNECT packet to initiate the Socket.IO session.
       *
       * @param data
       * @private
       */
      _sendConnectPacket(data) {
        this.packet({
          type: PacketType.CONNECT,
          data: this._pid ? Object.assign({ pid: this._pid, offset: this._lastOffset }, data) : data
        });
      }
      /**
       * Called upon engine or manager `error`.
       *
       * @param err
       * @private
       */
      onerror(err) {
        if (!this.connected) {
          this.emitReserved("connect_error", err);
        }
      }
      /**
       * Called upon engine `close`.
       *
       * @param reason
       * @param description
       * @private
       */
      onclose(reason, description) {
        this.connected = false;
        delete this.id;
        this.emitReserved("disconnect", reason, description);
        this._clearAcks();
      }
      /**
       * Clears the acknowledgement handlers upon disconnection, since the client will never receive an acknowledgement from
       * the server.
       *
       * @private
       */
      _clearAcks() {
        Object.keys(this.acks).forEach((id) => {
          const isBuffered = this.sendBuffer.some((packet) => String(packet.id) === id);
          if (!isBuffered) {
            const ack = this.acks[id];
            delete this.acks[id];
            if (ack.withError) {
              ack.call(this, new Error("socket has been disconnected"));
            }
          }
        });
      }
      /**
       * Called with socket packet.
       *
       * @param packet
       * @private
       */
      onpacket(packet) {
        const sameNamespace = packet.nsp === this.nsp;
        if (!sameNamespace)
          return;
        switch (packet.type) {
          case PacketType.CONNECT:
            if (packet.data && packet.data.sid) {
              this.onconnect(packet.data.sid, packet.data.pid);
            } else {
              this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
            }
            break;
          case PacketType.EVENT:
          case PacketType.BINARY_EVENT:
            this.onevent(packet);
            break;
          case PacketType.ACK:
          case PacketType.BINARY_ACK:
            this.onack(packet);
            break;
          case PacketType.DISCONNECT:
            this.ondisconnect();
            break;
          case PacketType.CONNECT_ERROR:
            this.destroy();
            const err = new Error(packet.data.message);
            err.data = packet.data.data;
            this.emitReserved("connect_error", err);
            break;
        }
      }
      /**
       * Called upon a server event.
       *
       * @param packet
       * @private
       */
      onevent(packet) {
        const args = packet.data || [];
        if (null != packet.id) {
          args.push(this.ack(packet.id));
        }
        if (this.connected) {
          this.emitEvent(args);
        } else {
          this.receiveBuffer.push(Object.freeze(args));
        }
      }
      emitEvent(args) {
        if (this._anyListeners && this._anyListeners.length) {
          const listeners = this._anyListeners.slice();
          for (const listener of listeners) {
            listener.apply(this, args);
          }
        }
        super.emit.apply(this, args);
        if (this._pid && args.length && typeof args[args.length - 1] === "string") {
          this._lastOffset = args[args.length - 1];
        }
      }
      /**
       * Produces an ack callback to emit with an event.
       *
       * @private
       */
      ack(id) {
        const self2 = this;
        let sent = false;
        return function(...args) {
          if (sent)
            return;
          sent = true;
          self2.packet({
            type: PacketType.ACK,
            id,
            data: args
          });
        };
      }
      /**
       * Called upon a server acknowledgement.
       *
       * @param packet
       * @private
       */
      onack(packet) {
        const ack = this.acks[packet.id];
        if (typeof ack !== "function") {
          return;
        }
        delete this.acks[packet.id];
        if (ack.withError) {
          packet.data.unshift(null);
        }
        ack.apply(this, packet.data);
      }
      /**
       * Called upon server connect.
       *
       * @private
       */
      onconnect(id, pid) {
        this.id = id;
        this.recovered = pid && this._pid === pid;
        this._pid = pid;
        this.connected = true;
        this.emitBuffered();
        this._drainQueue(true);
        this.emitReserved("connect");
      }
      /**
       * Emit buffered events (received and emitted).
       *
       * @private
       */
      emitBuffered() {
        this.receiveBuffer.forEach((args) => this.emitEvent(args));
        this.receiveBuffer = [];
        this.sendBuffer.forEach((packet) => {
          this.notifyOutgoingListeners(packet);
          this.packet(packet);
        });
        this.sendBuffer = [];
      }
      /**
       * Called upon server disconnect.
       *
       * @private
       */
      ondisconnect() {
        this.destroy();
        this.onclose("io server disconnect");
      }
      /**
       * Called upon forced client/server side disconnections,
       * this method ensures the manager stops tracking us and
       * that reconnections don't get triggered for this.
       *
       * @private
       */
      destroy() {
        if (this.subs) {
          this.subs.forEach((subDestroy) => subDestroy());
          this.subs = void 0;
        }
        this.io["_destroy"](this);
      }
      /**
       * Disconnects the socket manually. In that case, the socket will not try to reconnect.
       *
       * If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
       *
       * @example
       * const socket = io();
       *
       * socket.on("disconnect", (reason) => {
       *   // console.log(reason); prints "io client disconnect"
       * });
       *
       * socket.disconnect();
       *
       * @return self
       */
      disconnect() {
        if (this.connected) {
          this.packet({ type: PacketType.DISCONNECT });
        }
        this.destroy();
        if (this.connected) {
          this.onclose("io client disconnect");
        }
        return this;
      }
      /**
       * Alias for {@link disconnect()}.
       *
       * @return self
       */
      close() {
        return this.disconnect();
      }
      /**
       * Sets the compress flag.
       *
       * @example
       * socket.compress(false).emit("hello");
       *
       * @param compress - if `true`, compresses the sending data
       * @return self
       */
      compress(compress) {
        this.flags.compress = compress;
        return this;
      }
      /**
       * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
       * ready to send messages.
       *
       * @example
       * socket.volatile.emit("hello"); // the server may or may not receive it
       *
       * @returns self
       */
      get volatile() {
        this.flags.volatile = true;
        return this;
      }
      /**
       * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
       * given number of milliseconds have elapsed without an acknowledgement from the server:
       *
       * @example
       * socket.timeout(5000).emit("my-event", (err) => {
       *   if (err) {
       *     // the server did not acknowledge the event in the given delay
       *   }
       * });
       *
       * @returns self
       */
      timeout(timeout) {
        this.flags.timeout = timeout;
        return this;
      }
      /**
       * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
       * callback.
       *
       * @example
       * socket.onAny((event, ...args) => {
       *   console.log(`got ${event}`);
       * });
       *
       * @param listener
       */
      onAny(listener) {
        this._anyListeners = this._anyListeners || [];
        this._anyListeners.push(listener);
        return this;
      }
      /**
       * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
       * callback. The listener is added to the beginning of the listeners array.
       *
       * @example
       * socket.prependAny((event, ...args) => {
       *   console.log(`got event ${event}`);
       * });
       *
       * @param listener
       */
      prependAny(listener) {
        this._anyListeners = this._anyListeners || [];
        this._anyListeners.unshift(listener);
        return this;
      }
      /**
       * Removes the listener that will be fired when any event is emitted.
       *
       * @example
       * const catchAllListener = (event, ...args) => {
       *   console.log(`got event ${event}`);
       * }
       *
       * socket.onAny(catchAllListener);
       *
       * // remove a specific listener
       * socket.offAny(catchAllListener);
       *
       * // or remove all listeners
       * socket.offAny();
       *
       * @param listener
       */
      offAny(listener) {
        if (!this._anyListeners) {
          return this;
        }
        if (listener) {
          const listeners = this._anyListeners;
          for (let i = 0; i < listeners.length; i++) {
            if (listener === listeners[i]) {
              listeners.splice(i, 1);
              return this;
            }
          }
        } else {
          this._anyListeners = [];
        }
        return this;
      }
      /**
       * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
       * e.g. to remove listeners.
       */
      listenersAny() {
        return this._anyListeners || [];
      }
      /**
       * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
       * callback.
       *
       * Note: acknowledgements sent to the server are not included.
       *
       * @example
       * socket.onAnyOutgoing((event, ...args) => {
       *   console.log(`sent event ${event}`);
       * });
       *
       * @param listener
       */
      onAnyOutgoing(listener) {
        this._anyOutgoingListeners = this._anyOutgoingListeners || [];
        this._anyOutgoingListeners.push(listener);
        return this;
      }
      /**
       * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
       * callback. The listener is added to the beginning of the listeners array.
       *
       * Note: acknowledgements sent to the server are not included.
       *
       * @example
       * socket.prependAnyOutgoing((event, ...args) => {
       *   console.log(`sent event ${event}`);
       * });
       *
       * @param listener
       */
      prependAnyOutgoing(listener) {
        this._anyOutgoingListeners = this._anyOutgoingListeners || [];
        this._anyOutgoingListeners.unshift(listener);
        return this;
      }
      /**
       * Removes the listener that will be fired when any event is emitted.
       *
       * @example
       * const catchAllListener = (event, ...args) => {
       *   console.log(`sent event ${event}`);
       * }
       *
       * socket.onAnyOutgoing(catchAllListener);
       *
       * // remove a specific listener
       * socket.offAnyOutgoing(catchAllListener);
       *
       * // or remove all listeners
       * socket.offAnyOutgoing();
       *
       * @param [listener] - the catch-all listener (optional)
       */
      offAnyOutgoing(listener) {
        if (!this._anyOutgoingListeners) {
          return this;
        }
        if (listener) {
          const listeners = this._anyOutgoingListeners;
          for (let i = 0; i < listeners.length; i++) {
            if (listener === listeners[i]) {
              listeners.splice(i, 1);
              return this;
            }
          }
        } else {
          this._anyOutgoingListeners = [];
        }
        return this;
      }
      /**
       * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
       * e.g. to remove listeners.
       */
      listenersAnyOutgoing() {
        return this._anyOutgoingListeners || [];
      }
      /**
       * Notify the listeners for each packet sent
       *
       * @param packet
       *
       * @private
       */
      notifyOutgoingListeners(packet) {
        if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
          const listeners = this._anyOutgoingListeners.slice();
          for (const listener of listeners) {
            listener.apply(this, packet.data);
          }
        }
      }
    };
  }
});

// node_modules/socket.io-client/build/esm/contrib/backo2.js
function Backoff(opts) {
  opts = opts || {};
  this.ms = opts.min || 100;
  this.max = opts.max || 1e4;
  this.factor = opts.factor || 2;
  this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
  this.attempts = 0;
}
var init_backo2 = __esm({
  "node_modules/socket.io-client/build/esm/contrib/backo2.js"() {
    Backoff.prototype.duration = function() {
      var ms = this.ms * Math.pow(this.factor, this.attempts++);
      if (this.jitter) {
        var rand = Math.random();
        var deviation = Math.floor(rand * this.jitter * ms);
        ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
      }
      return Math.min(ms, this.max) | 0;
    };
    Backoff.prototype.reset = function() {
      this.attempts = 0;
    };
    Backoff.prototype.setMin = function(min) {
      this.ms = min;
    };
    Backoff.prototype.setMax = function(max) {
      this.max = max;
    };
    Backoff.prototype.setJitter = function(jitter) {
      this.jitter = jitter;
    };
  }
});

// node_modules/socket.io-client/build/esm/manager.js
var Manager;
var init_manager = __esm({
  "node_modules/socket.io-client/build/esm/manager.js"() {
    init_esm3();
    init_socket2();
    init_esm4();
    init_on();
    init_backo2();
    init_esm2();
    Manager = class extends Emitter {
      constructor(uri, opts) {
        var _a;
        super();
        this.nsps = {};
        this.subs = [];
        if (uri && "object" === typeof uri) {
          opts = uri;
          uri = void 0;
        }
        opts = opts || {};
        opts.path = opts.path || "/socket.io";
        this.opts = opts;
        installTimerFunctions(this, opts);
        this.reconnection(opts.reconnection !== false);
        this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
        this.reconnectionDelay(opts.reconnectionDelay || 1e3);
        this.reconnectionDelayMax(opts.reconnectionDelayMax || 5e3);
        this.randomizationFactor((_a = opts.randomizationFactor) !== null && _a !== void 0 ? _a : 0.5);
        this.backoff = new Backoff({
          min: this.reconnectionDelay(),
          max: this.reconnectionDelayMax(),
          jitter: this.randomizationFactor()
        });
        this.timeout(null == opts.timeout ? 2e4 : opts.timeout);
        this._readyState = "closed";
        this.uri = uri;
        const _parser = opts.parser || esm_exports;
        this.encoder = new _parser.Encoder();
        this.decoder = new _parser.Decoder();
        this._autoConnect = opts.autoConnect !== false;
        if (this._autoConnect)
          this.open();
      }
      reconnection(v) {
        if (!arguments.length)
          return this._reconnection;
        this._reconnection = !!v;
        if (!v) {
          this.skipReconnect = true;
        }
        return this;
      }
      reconnectionAttempts(v) {
        if (v === void 0)
          return this._reconnectionAttempts;
        this._reconnectionAttempts = v;
        return this;
      }
      reconnectionDelay(v) {
        var _a;
        if (v === void 0)
          return this._reconnectionDelay;
        this._reconnectionDelay = v;
        (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
        return this;
      }
      randomizationFactor(v) {
        var _a;
        if (v === void 0)
          return this._randomizationFactor;
        this._randomizationFactor = v;
        (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
        return this;
      }
      reconnectionDelayMax(v) {
        var _a;
        if (v === void 0)
          return this._reconnectionDelayMax;
        this._reconnectionDelayMax = v;
        (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
        return this;
      }
      timeout(v) {
        if (!arguments.length)
          return this._timeout;
        this._timeout = v;
        return this;
      }
      /**
       * Starts trying to reconnect if reconnection is enabled and we have not
       * started reconnecting yet
       *
       * @private
       */
      maybeReconnectOnOpen() {
        if (!this._reconnecting && this._reconnection && this.backoff.attempts === 0) {
          this.reconnect();
        }
      }
      /**
       * Sets the current transport `socket`.
       *
       * @param {Function} fn - optional, callback
       * @return self
       * @public
       */
      open(fn) {
        if (~this._readyState.indexOf("open"))
          return this;
        this.engine = new Socket(this.uri, this.opts);
        const socket = this.engine;
        const self2 = this;
        this._readyState = "opening";
        this.skipReconnect = false;
        const openSubDestroy = on(socket, "open", function() {
          self2.onopen();
          fn && fn();
        });
        const onError = (err) => {
          this.cleanup();
          this._readyState = "closed";
          this.emitReserved("error", err);
          if (fn) {
            fn(err);
          } else {
            this.maybeReconnectOnOpen();
          }
        };
        const errorSub = on(socket, "error", onError);
        if (false !== this._timeout) {
          const timeout = this._timeout;
          const timer = this.setTimeoutFn(() => {
            openSubDestroy();
            onError(new Error("timeout"));
            socket.close();
          }, timeout);
          if (this.opts.autoUnref) {
            timer.unref();
          }
          this.subs.push(() => {
            this.clearTimeoutFn(timer);
          });
        }
        this.subs.push(openSubDestroy);
        this.subs.push(errorSub);
        return this;
      }
      /**
       * Alias for open()
       *
       * @return self
       * @public
       */
      connect(fn) {
        return this.open(fn);
      }
      /**
       * Called upon transport open.
       *
       * @private
       */
      onopen() {
        this.cleanup();
        this._readyState = "open";
        this.emitReserved("open");
        const socket = this.engine;
        this.subs.push(
          on(socket, "ping", this.onping.bind(this)),
          on(socket, "data", this.ondata.bind(this)),
          on(socket, "error", this.onerror.bind(this)),
          on(socket, "close", this.onclose.bind(this)),
          // @ts-ignore
          on(this.decoder, "decoded", this.ondecoded.bind(this))
        );
      }
      /**
       * Called upon a ping.
       *
       * @private
       */
      onping() {
        this.emitReserved("ping");
      }
      /**
       * Called with data.
       *
       * @private
       */
      ondata(data) {
        try {
          this.decoder.add(data);
        } catch (e) {
          this.onclose("parse error", e);
        }
      }
      /**
       * Called when parser fully decodes a packet.
       *
       * @private
       */
      ondecoded(packet) {
        nextTick(() => {
          this.emitReserved("packet", packet);
        }, this.setTimeoutFn);
      }
      /**
       * Called upon socket error.
       *
       * @private
       */
      onerror(err) {
        this.emitReserved("error", err);
      }
      /**
       * Creates a new socket for the given `nsp`.
       *
       * @return {Socket}
       * @public
       */
      socket(nsp, opts) {
        let socket = this.nsps[nsp];
        if (!socket) {
          socket = new Socket2(this, nsp, opts);
          this.nsps[nsp] = socket;
        } else if (this._autoConnect && !socket.active) {
          socket.connect();
        }
        return socket;
      }
      /**
       * Called upon a socket close.
       *
       * @param socket
       * @private
       */
      _destroy(socket) {
        const nsps = Object.keys(this.nsps);
        for (const nsp of nsps) {
          const socket2 = this.nsps[nsp];
          if (socket2.active) {
            return;
          }
        }
        this._close();
      }
      /**
       * Writes a packet.
       *
       * @param packet
       * @private
       */
      _packet(packet) {
        const encodedPackets = this.encoder.encode(packet);
        for (let i = 0; i < encodedPackets.length; i++) {
          this.engine.write(encodedPackets[i], packet.options);
        }
      }
      /**
       * Clean up transport subscriptions and packet buffer.
       *
       * @private
       */
      cleanup() {
        this.subs.forEach((subDestroy) => subDestroy());
        this.subs.length = 0;
        this.decoder.destroy();
      }
      /**
       * Close the current socket.
       *
       * @private
       */
      _close() {
        this.skipReconnect = true;
        this._reconnecting = false;
        this.onclose("forced close");
      }
      /**
       * Alias for close()
       *
       * @private
       */
      disconnect() {
        return this._close();
      }
      /**
       * Called when:
       *
       * - the low-level engine is closed
       * - the parser encountered a badly formatted packet
       * - all sockets are disconnected
       *
       * @private
       */
      onclose(reason, description) {
        var _a;
        this.cleanup();
        (_a = this.engine) === null || _a === void 0 ? void 0 : _a.close();
        this.backoff.reset();
        this._readyState = "closed";
        this.emitReserved("close", reason, description);
        if (this._reconnection && !this.skipReconnect) {
          this.reconnect();
        }
      }
      /**
       * Attempt a reconnection.
       *
       * @private
       */
      reconnect() {
        if (this._reconnecting || this.skipReconnect)
          return this;
        const self2 = this;
        if (this.backoff.attempts >= this._reconnectionAttempts) {
          this.backoff.reset();
          this.emitReserved("reconnect_failed");
          this._reconnecting = false;
        } else {
          const delay = this.backoff.duration();
          this._reconnecting = true;
          const timer = this.setTimeoutFn(() => {
            if (self2.skipReconnect)
              return;
            this.emitReserved("reconnect_attempt", self2.backoff.attempts);
            if (self2.skipReconnect)
              return;
            self2.open((err) => {
              if (err) {
                self2._reconnecting = false;
                self2.reconnect();
                this.emitReserved("reconnect_error", err);
              } else {
                self2.onreconnect();
              }
            });
          }, delay);
          if (this.opts.autoUnref) {
            timer.unref();
          }
          this.subs.push(() => {
            this.clearTimeoutFn(timer);
          });
        }
      }
      /**
       * Called upon successful reconnect.
       *
       * @private
       */
      onreconnect() {
        const attempt = this.backoff.attempts;
        this._reconnecting = false;
        this.backoff.reset();
        this.emitReserved("reconnect", attempt);
      }
    };
  }
});

// node_modules/socket.io-client/build/esm/index.js
var esm_exports2 = {};
__export(esm_exports2, {
  Fetch: () => Fetch,
  Manager: () => Manager,
  NodeWebSocket: () => WS,
  NodeXHR: () => XHR,
  Socket: () => Socket2,
  WebSocket: () => WS,
  WebTransport: () => WT,
  XHR: () => XHR,
  connect: () => lookup2,
  default: () => lookup2,
  io: () => lookup2,
  protocol: () => protocol3
});
function lookup2(uri, opts) {
  if (typeof uri === "object") {
    opts = uri;
    uri = void 0;
  }
  opts = opts || {};
  const parsed = url(uri, opts.path || "/socket.io");
  const source = parsed.source;
  const id = parsed.id;
  const path = parsed.path;
  const sameNamespace = cache[id] && path in cache[id]["nsps"];
  const newConnection = opts.forceNew || opts["force new connection"] || false === opts.multiplex || sameNamespace;
  let io;
  if (newConnection) {
    io = new Manager(source, opts);
  } else {
    if (!cache[id]) {
      cache[id] = new Manager(source, opts);
    }
    io = cache[id];
  }
  if (parsed.query && !opts.query) {
    opts.query = parsed.queryKey;
  }
  return io.socket(parsed.path, opts);
}
var cache;
var init_esm5 = __esm({
  "node_modules/socket.io-client/build/esm/index.js"() {
    init_url();
    init_manager();
    init_socket2();
    init_esm4();
    init_esm3();
    cache = {};
    Object.assign(lookup2, {
      Manager,
      Socket: Socket2,
      io: lookup2,
      connect: lookup2
    });
  }
});

// node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value2) => {
    if (typeof value2 === "bigint") {
      return value2.toString();
    }
    return value2;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value2) {
    if (!(value2 instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value2}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value2 = await pair.value;
      syncPairs.push({
        key,
        value: value2
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value: value2 } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value2.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value2.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value2.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value2.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value2) => ({ status: "dirty", value: value2 });
var OK = (value2) => ({ status: "valid", value: value2 });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value2, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value2;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value2, options) {
    return this._addCheck({
      kind: "includes",
      value: value2,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value2, message) {
    return this._addCheck({
      kind: "startsWith",
      value: value2,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value2, message) {
    return this._addCheck({
      kind: "endsWith",
      value: value2,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value2, message) {
    return this.setLimit("min", value2, true, errorUtil.toString(message));
  }
  gt(value2, message) {
    return this.setLimit("min", value2, false, errorUtil.toString(message));
  }
  lte(value2, message) {
    return this.setLimit("max", value2, true, errorUtil.toString(message));
  }
  lt(value2, message) {
    return this.setLimit("max", value2, false, errorUtil.toString(message));
  }
  setLimit(kind, value2, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value: value2,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value2, message) {
    return this._addCheck({
      kind: "multipleOf",
      value: value2,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value2, message) {
    return this.setLimit("min", value2, true, errorUtil.toString(message));
  }
  gt(value2, message) {
    return this.setLimit("min", value2, false, errorUtil.toString(message));
  }
  lte(value2, message) {
    return this.setLimit("max", value2, true, errorUtil.toString(message));
  }
  lt(value2, message) {
    return this.setLimit("max", value2, false, errorUtil.toString(message));
  }
  setLimit(kind, value2, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value: value2,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value2, message) {
    return this._addCheck({
      kind: "multipleOf",
      value: value2,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value2 = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value2, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value2 = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value2, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value2 = await pair.value;
          syncPairs.push({
            key,
            value: value2,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index2) {
    return new _ZodObject({
      ...this._def,
      catchall: index2
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value2 of discriminatorValues) {
        if (optionsMap.has(value2)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value2)}`);
        }
        optionsMap.set(value2, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index2 = 0; index2 < a.length; index2++) {
      const itemA = a[index2];
      const itemB = b[index2];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value2], index2) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index2, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value2, ctx.path, [index2, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value2 = await pair.value;
          if (key.status === "aborted" || value2.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value2.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value2.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value2 = pair.value;
        if (key.status === "aborted" || value2.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value2.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value2.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value2, params) => {
  return new ZodLiteral({
    value: value2,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = /* @__PURE__ */ Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: ((arg) => ZodString.create({ ...arg, coerce: true })),
  number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
  boolean: ((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  })),
  bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
  date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
};
var NEVER = INVALID;

// node_modules/@insforge/shared-schemas/dist/database.schema.js
var ColumnType;
(function(ColumnType2) {
  ColumnType2["STRING"] = "string";
  ColumnType2["DATE"] = "date";
  ColumnType2["DATETIME"] = "datetime";
  ColumnType2["INTEGER"] = "integer";
  ColumnType2["FLOAT"] = "float";
  ColumnType2["BOOLEAN"] = "boolean";
  ColumnType2["UUID"] = "uuid";
  ColumnType2["JSON"] = "json";
})(ColumnType || (ColumnType = {}));
var onUpdateActionSchema = external_exports.enum([
  "CASCADE",
  "SET NULL",
  "SET DEFAULT",
  "RESTRICT",
  "NO ACTION"
]);
var onDeleteActionSchema = external_exports.enum([
  "CASCADE",
  "SET NULL",
  "SET DEFAULT",
  "RESTRICT",
  "NO ACTION"
]);
var columnTypeSchema = external_exports.enum([
  ColumnType.STRING,
  ColumnType.DATE,
  ColumnType.DATETIME,
  ColumnType.INTEGER,
  ColumnType.FLOAT,
  ColumnType.BOOLEAN,
  ColumnType.UUID,
  ColumnType.JSON
]);
var foreignKeyReferenceSchema = external_exports.object({
  sourceColumn: external_exports.string().min(1, "Source column cannot be empty"),
  referenceColumn: external_exports.string().min(1, "Reference column cannot be empty")
});
var foreignKeySchema = external_exports.object({
  // Constraint identity. Populated when reading schema; derived by the backend on create.
  constraintName: external_exports.string().optional(),
  referenceTable: external_exports.string().min(1, "Target table cannot be empty"),
  referenceColumns: external_exports.array(foreignKeyReferenceSchema).min(1, "At least one column mapping is required"),
  onDelete: onDeleteActionSchema,
  onUpdate: onUpdateActionSchema
});
var columnSchema = external_exports.object({
  columnName: external_exports.string().min(1, "Column name cannot be empty").max(64, "Column name must be less than 64 characters"),
  type: external_exports.union([columnTypeSchema, external_exports.string()]),
  defaultValue: external_exports.string().optional(),
  isPrimaryKey: external_exports.boolean().optional(),
  isNullable: external_exports.boolean(),
  isUnique: external_exports.boolean()
});
var tableSchema = external_exports.object({
  schemaName: external_exports.string().optional(),
  tableName: external_exports.string().min(1, "Table name cannot be empty").max(64, "Table name must be less than 64 characters"),
  columns: external_exports.array(columnSchema).min(1, "At least one column is required"),
  // Foreign keys are table-level, one entry per constraint.
  foreignKeys: external_exports.array(foreignKeySchema).optional(),
  recordCount: external_exports.number().optional(),
  createdAt: external_exports.string().optional(),
  updatedAt: external_exports.string().optional()
});
var databaseSchemaInfoSchema = external_exports.object({
  name: external_exports.string(),
  isProtected: external_exports.boolean()
});
var databaseFunctionSchema = external_exports.object({
  functionName: external_exports.string(),
  functionDef: external_exports.string(),
  kind: external_exports.string()
});
var databaseIndexSchema = external_exports.object({
  tableName: external_exports.string(),
  indexName: external_exports.string(),
  indexDef: external_exports.string(),
  isUnique: external_exports.boolean().nullable(),
  isPrimary: external_exports.boolean().nullable()
});
var databasePolicySchema = external_exports.object({
  tableName: external_exports.string(),
  policyName: external_exports.string(),
  cmd: external_exports.string(),
  roles: external_exports.array(external_exports.string()),
  qual: external_exports.string().nullable(),
  withCheck: external_exports.string().nullable()
});
var databaseTriggerSchema = external_exports.object({
  tableName: external_exports.string(),
  triggerName: external_exports.string(),
  actionTiming: external_exports.string(),
  eventManipulation: external_exports.string(),
  actionOrientation: external_exports.string(),
  actionCondition: external_exports.string().nullable(),
  actionStatement: external_exports.string()
});
var migrationSchema = external_exports.object({
  version: external_exports.string().regex(/^\d{1,64}$/, "Migration version must be a numeric string of at most 64 digits (e.g. 0001 or 20260418091500)."),
  name: external_exports.string().min(1),
  statements: external_exports.array(external_exports.string()).min(1),
  createdAt: external_exports.string()
});
var databaseBackupSchema = external_exports.object({
  id: external_exports.string(),
  name: external_exports.string().nullable(),
  triggerSource: external_exports.enum(["manual", "scheduled"]),
  status: external_exports.enum(["running", "completed", "failed"]),
  sizeBytes: external_exports.number().nullable(),
  errorMessage: external_exports.string().nullable(),
  createdAt: external_exports.string(),
  completedAt: external_exports.string().nullable(),
  createdBy: external_exports.string().nullable()
});

// node_modules/@insforge/shared-schemas/dist/database-api.schema.js
var createTableRequestSchema = tableSchema.pick({
  tableName: true,
  columns: true,
  foreignKeys: true
}).extend({
  rlsEnabled: external_exports.boolean().default(true)
});
var createTableResponseSchema = tableSchema.pick({
  schemaName: true,
  tableName: true,
  columns: true
}).extend({
  message: external_exports.string(),
  autoFields: external_exports.array(external_exports.string()),
  nextActions: external_exports.string()
});
var updateTableSchemaRequestSchema = external_exports.object({
  addColumns: external_exports.array(columnSchema).optional(),
  dropColumns: external_exports.array(external_exports.string()).optional(),
  updateColumns: external_exports.array(external_exports.object({
    columnName: external_exports.string(),
    defaultValue: external_exports.string().optional(),
    newColumnName: external_exports.string().min(1, "New column name cannot be empty").max(64, "New column name must be less than 64 characters").optional()
  })).optional(),
  // Each entry is a full foreign-key constraint (composite keys are one entry).
  addForeignKeys: external_exports.array(foreignKeySchema).optional(),
  // Constraint names to drop.
  dropForeignKeys: external_exports.array(external_exports.string()).optional(),
  renameTable: external_exports.object({
    newTableName: external_exports.string().min(1, "New table name cannot be empty").max(64, "New table name must be less than 64 characters")
  }).optional()
});
var updateTableSchemaResponse = external_exports.object({
  schemaName: external_exports.string().optional(),
  message: external_exports.string(),
  tableName: external_exports.string(),
  operations: external_exports.array(external_exports.string())
});
var deleteTableResponse = external_exports.object({
  schemaName: external_exports.string().optional(),
  message: external_exports.string(),
  tableName: external_exports.string(),
  nextActions: external_exports.string()
});
var rawSQLRequestSchema = external_exports.object({
  query: external_exports.string().min(1, "Query is required"),
  params: external_exports.array(external_exports.unknown()).optional(),
  /**
   * Whether to execute EXPLAIN (FORMAT JSON, ANALYZE, BUFFERS) on the query.
   * This is restricted to read-only SELECT queries to maintain authorization parity
   * and prevent database sequence or state mutations.
   */
  explain: external_exports.boolean().optional()
});
var rawSQLResponseSchema = external_exports.object({
  rows: external_exports.array(external_exports.record(external_exports.string(), external_exports.unknown())),
  rowCount: external_exports.number().nullable(),
  fields: external_exports.array(external_exports.object({
    name: external_exports.string(),
    dataTypeID: external_exports.number()
  })).optional()
});
var exportRequestSchema = external_exports.object({
  tables: external_exports.array(external_exports.string()).optional(),
  format: external_exports.enum(["sql", "json"]).default("sql"),
  includeData: external_exports.boolean().default(true),
  includeFunctions: external_exports.boolean().default(false),
  includeSequences: external_exports.boolean().default(false),
  includeViews: external_exports.boolean().default(false),
  rowLimit: external_exports.number().int().positive().max(1e4).default(1e3)
});
var exportJsonDataSchema = external_exports.object({
  timestamp: external_exports.string(),
  tables: external_exports.record(external_exports.string(), external_exports.object({
    schema: external_exports.array(external_exports.object({
      columnName: external_exports.string(),
      dataType: external_exports.string(),
      characterMaximumLength: external_exports.number().nullable(),
      isNullable: external_exports.string(),
      columnDefault: external_exports.string().nullable()
    })),
    indexes: external_exports.array(external_exports.object({
      indexname: external_exports.string(),
      indexdef: external_exports.string(),
      isUnique: external_exports.boolean().nullable(),
      isPrimary: external_exports.boolean().nullable()
    })),
    // Table-level foreign keys: one entry per constraint (composite keys list
    // multiple column mappings), consistent with the rest of the schema model.
    foreignKeys: external_exports.array(foreignKeySchema),
    rlsEnabled: external_exports.boolean().optional(),
    policies: external_exports.array(external_exports.object({
      policyname: external_exports.string(),
      cmd: external_exports.string(),
      roles: external_exports.array(external_exports.string()),
      qual: external_exports.string().nullable(),
      withCheck: external_exports.string().nullable()
    })),
    triggers: external_exports.array(external_exports.object({
      triggerName: external_exports.string(),
      actionTiming: external_exports.string(),
      eventManipulation: external_exports.string(),
      actionOrientation: external_exports.string(),
      actionCondition: external_exports.string().nullable(),
      actionStatement: external_exports.string(),
      newTable: external_exports.string().nullable(),
      oldTable: external_exports.string().nullable()
    })),
    rows: external_exports.array(external_exports.record(external_exports.string(), external_exports.unknown())).optional(),
    recordCount: external_exports.number().optional()
  })),
  functions: external_exports.array(external_exports.object({
    functionName: external_exports.string(),
    functionDef: external_exports.string(),
    kind: external_exports.string()
  })),
  sequences: external_exports.array(external_exports.object({
    sequenceName: external_exports.string(),
    startValue: external_exports.string(),
    increment: external_exports.string(),
    minValue: external_exports.string().nullable(),
    maxValue: external_exports.string().nullable(),
    cycle: external_exports.string()
  })),
  views: external_exports.array(external_exports.object({
    viewName: external_exports.string(),
    definition: external_exports.string()
  }))
});
var exportResponseSchema = external_exports.object({
  format: external_exports.enum(["sql", "json"]),
  data: external_exports.union([external_exports.string(), exportJsonDataSchema]),
  timestamp: external_exports.string()
});
var importRequestSchema = external_exports.object({
  truncate: external_exports.union([
    external_exports.boolean(),
    external_exports.string().transform((val) => {
      if (val === "true")
        return true;
      if (val === "false")
        return false;
      throw new Error("Invalid boolean string");
    })
  ]).default(false)
});
var importResponseSchema = external_exports.object({
  success: external_exports.boolean(),
  message: external_exports.string(),
  filename: external_exports.string(),
  tables: external_exports.array(external_exports.string()),
  rowsImported: external_exports.number(),
  fileSize: external_exports.number()
});
var bulkUpsertRequestSchema = external_exports.object({
  schema: external_exports.string().default("public"),
  table: external_exports.string().min(1, "Table name is required"),
  upsertKey: external_exports.string().optional()
  // Note: File handling is done at the API layer via multipart/form-data
});
var bulkUpsertResponseSchema = external_exports.object({
  success: external_exports.boolean(),
  message: external_exports.string(),
  table: external_exports.string(),
  rowsAffected: external_exports.number(),
  totalRecords: external_exports.number(),
  filename: external_exports.string()
});
var adminTableRecordSchema = external_exports.record(external_exports.string(), external_exports.unknown());
var adminTableRecordsSortClauseSchema = external_exports.object({
  columnName: external_exports.string().trim().min(1, "Column name is required"),
  direction: external_exports.enum(["asc", "desc"])
});
var adminTableRecordsListQuerySchema = external_exports.object({
  limit: external_exports.coerce.number().int().min(1).max(500).default(50),
  offset: external_exports.coerce.number().int().min(0).default(0),
  search: external_exports.string().trim().optional(),
  sort: external_exports.string().trim().optional(),
  filterColumn: external_exports.string().trim().optional(),
  filterValue: external_exports.string().optional()
}).refine((value2) => value2.filterColumn === void 0 && value2.filterValue === void 0 || value2.filterColumn !== void 0 && value2.filterValue !== void 0, {
  message: "filterColumn and filterValue must be provided together.",
  path: ["filterColumn"]
});
var adminTableRecordLookupQuerySchema = external_exports.object({
  column: external_exports.union([external_exports.string().trim().min(1), external_exports.array(external_exports.string().trim().min(1)).min(1)]),
  value: external_exports.union([external_exports.string(), external_exports.array(external_exports.string()).min(1)])
}).refine((data) => {
  const cols = Array.isArray(data.column) ? data.column : [data.column];
  const vals = Array.isArray(data.value) ? data.value : [data.value];
  return cols.length === vals.length;
}, {
  message: "column and value must have the same number of entries",
  path: ["value"]
});
var adminTableRecordsCreateRequestSchema = external_exports.array(adminTableRecordSchema).min(1, "At least one record is required");
var adminTableRecordPkValueSchema = external_exports.union([
  external_exports.string(),
  external_exports.number(),
  external_exports.boolean(),
  external_exports.null()
]);
var adminTableRecordPrimaryKeySchema = external_exports.record(external_exports.string().trim().min(1, "Primary key column is required"), adminTableRecordPkValueSchema).refine((key) => Object.keys(key).length > 0, {
  message: "Primary key must include at least one column."
});
var adminTableRecordUpdateDataSchema = adminTableRecordSchema.refine((record) => Object.keys(record).length > 0, {
  message: "At least one field is required."
});
var adminTableRecordUpdateRequestSchema = external_exports.object({
  pkKeys: adminTableRecordPrimaryKeySchema,
  data: adminTableRecordUpdateDataSchema
});
var adminTableRecordsDeleteRequestSchema = external_exports.object({
  pkKeys: external_exports.array(adminTableRecordPrimaryKeySchema).min(1, "At least one primary key is required")
});
var adminTableRecordLookupResponseSchema = adminTableRecordSchema.nullable();
var adminTableRecordsCreateResponseSchema = external_exports.array(adminTableRecordSchema);
var adminTableRecordsListResponseSchema = external_exports.object({
  data: external_exports.array(adminTableRecordSchema),
  pagination: external_exports.object({
    offset: external_exports.number().int().min(0),
    limit: external_exports.number().int().min(1),
    total: external_exports.number().int().min(0)
  })
});
var adminTableRecordsDeleteResponseSchema = external_exports.object({
  deletedCount: external_exports.number().int().min(0)
});
var createMigrationRequestSchema = external_exports.object({
  version: external_exports.string().regex(/^\d{1,64}$/, "Migration version must be a numeric string of at most 64 digits (e.g. 0001 or 20260418091500)."),
  name: external_exports.string().trim().min(1, "Migration name is required").refine((value2) => value2.length === 0 || /^[a-z0-9-]+$/.test(value2), {
    message: "Use lowercase letters, numbers, and hyphens only."
  }),
  sql: external_exports.string().trim().min(1, "Migration SQL is required")
});
var createMigrationResponseSchema = migrationSchema.extend({
  message: external_exports.string()
});
var databaseFunctionsResponseSchema = external_exports.object({
  functions: external_exports.array(databaseFunctionSchema)
});
var databaseSchemasResponseSchema = external_exports.object({
  schemas: external_exports.array(databaseSchemaInfoSchema)
});
var databaseIndexesResponseSchema = external_exports.object({
  indexes: external_exports.array(databaseIndexSchema)
});
var databasePoliciesResponseSchema = external_exports.object({
  policies: external_exports.array(databasePolicySchema)
});
var databaseTriggersResponseSchema = external_exports.object({
  triggers: external_exports.array(databaseTriggerSchema)
});
var databaseMigrationsResponseSchema = external_exports.object({
  migrations: external_exports.array(migrationSchema)
});
var createDatabaseBackupRequestSchema = external_exports.object({
  name: external_exports.string().trim().min(1, "Backup name cannot be empty").max(64, "Backup name must be less than 64 characters").optional()
});
var renameDatabaseBackupRequestSchema = external_exports.object({
  name: external_exports.string().trim().min(1, "Backup name cannot be empty").max(64, "Backup name must be less than 64 characters").nullable()
});
var databaseBackupsResponseSchema = external_exports.object({
  backups: external_exports.array(databaseBackupSchema)
});
var deleteDatabaseBackupResponseSchema = external_exports.object({
  message: external_exports.string()
});
var restoreDatabaseBackupResponseSchema = external_exports.object({
  message: external_exports.string()
});

// node_modules/@insforge/shared-schemas/dist/secrets.schema.js
var secretSchema = external_exports.object({
  id: external_exports.string(),
  key: external_exports.string(),
  isActive: external_exports.boolean(),
  isReserved: external_exports.boolean(),
  lastUsedAt: external_exports.string().nullable(),
  expiresAt: external_exports.string().nullable(),
  createdAt: external_exports.string(),
  updatedAt: external_exports.string()
});

// node_modules/@insforge/shared-schemas/dist/secrets-api.schema.js
var listSecretsResponseSchema = external_exports.object({
  secrets: external_exports.array(secretSchema)
});
var getSecretValueResponseSchema = external_exports.object({
  key: external_exports.string(),
  value: external_exports.string()
});
var createSecretRequestSchema = external_exports.object({
  key: external_exports.string().regex(/^[A-Z0-9_]+$/, "Use uppercase letters, numbers, and underscores only"),
  value: external_exports.string().min(1, "Value is required")
});
var createSecretResponseSchema = external_exports.object({
  success: external_exports.literal(true),
  message: external_exports.string(),
  id: external_exports.string()
});
var updateSecretResponseSchema = external_exports.object({
  success: external_exports.literal(true),
  message: external_exports.string()
});
var deleteSecretResponseSchema = external_exports.object({
  success: external_exports.literal(true),
  message: external_exports.string()
});
var rotateApiKeyRequestSchema = external_exports.object({
  gracePeriodHours: external_exports.coerce.number().int().nonnegative().max(168).optional()
});
var rotateApiKeyResponseSchema = external_exports.object({
  success: external_exports.literal(true),
  message: external_exports.string(),
  apiKey: external_exports.string(),
  oldKeyExpiresAt: external_exports.string()
});
var rotateAnonKeyRequestSchema = external_exports.object({
  gracePeriodHours: external_exports.coerce.number().int().nonnegative().max(720).optional()
});
var rotateAnonKeyResponseSchema = external_exports.object({
  success: external_exports.literal(true),
  message: external_exports.string(),
  anonKey: external_exports.string(),
  oldKeyExpiresAt: external_exports.string()
});

// node_modules/@insforge/shared-schemas/dist/storage.schema.js
var storageFileSchema = external_exports.object({
  key: external_exports.string(),
  bucket: external_exports.string(),
  size: external_exports.number(),
  mimeType: external_exports.string().optional(),
  uploadedAt: external_exports.string(),
  url: external_exports.string()
});
var storageBucketSchema = external_exports.object({
  name: external_exports.string(),
  public: external_exports.boolean(),
  createdAt: external_exports.string()
});
var storageConfigSchema = external_exports.object({
  id: external_exports.string().uuid(),
  maxFileSizeMb: external_exports.number().int().positive(),
  createdAt: external_exports.string(),
  updatedAt: external_exports.string()
});

// node_modules/@insforge/shared-schemas/dist/storage-api.schema.js
var createBucketRequestSchema = external_exports.object({
  bucketName: external_exports.string().min(1, "Bucket name cannot be empty"),
  isPublic: external_exports.boolean().default(true)
});
var updateBucketRequestSchema = external_exports.object({
  isPublic: external_exports.boolean()
});
var listObjectsResponseSchema = external_exports.object({
  objects: external_exports.array(storageFileSchema),
  pagination: external_exports.object({
    offset: external_exports.number(),
    limit: external_exports.number(),
    total: external_exports.number()
  })
});
var deleteObjectsRequestSchema = external_exports.object({
  keys: external_exports.array(external_exports.string().min(1, "Object key cannot be empty")).min(1, "At least one object key is required").max(1e3, "Cannot delete more than 1000 objects at once")
});
var deleteObjectResultSchema = external_exports.object({
  key: external_exports.string(),
  status: external_exports.enum(["deleted", "notFound", "failed"]),
  message: external_exports.string().optional()
});
var deleteObjectsResponseSchema = external_exports.object({
  results: external_exports.array(deleteObjectResultSchema)
});
var uploadStrategyRequestSchema = external_exports.object({
  // The object key to upload to. Uploading to an existing key replaces it
  // (standard PUT semantics). Callers that want a server-generated unique
  // key use POST /objects instead.
  filename: external_exports.string().min(1, "Filename cannot be empty"),
  contentType: external_exports.string().optional(),
  size: external_exports.number().optional()
});
var uploadStrategyResponseSchema = external_exports.object({
  method: external_exports.enum(["presigned", "direct"]),
  uploadUrl: external_exports.string(),
  fields: external_exports.record(external_exports.string()).optional(),
  key: external_exports.string(),
  confirmRequired: external_exports.boolean(),
  confirmUrl: external_exports.string().optional(),
  expiresAt: external_exports.date().optional()
});
var downloadStrategyResponseSchema = external_exports.object({
  method: external_exports.enum(["presigned", "direct"]),
  url: external_exports.string(),
  expiresAt: external_exports.date().optional(),
  headers: external_exports.record(external_exports.string()).optional()
});
var confirmUploadRequestSchema = external_exports.object({
  size: external_exports.number(),
  contentType: external_exports.string().optional(),
  etag: external_exports.string().optional()
});
var updateStorageConfigRequestSchema = external_exports.object({
  maxFileSizeMb: external_exports.number().int().min(1, "Must be at least 1 MB").max(200, "Must be at most 200 MB")
});

// node_modules/@insforge/shared-schemas/dist/s3-access-key.schema.js
var s3AccessKeySchema = external_exports.object({
  id: external_exports.string().uuid(),
  accessKeyId: external_exports.string().regex(/^INSF[A-Z0-9]{16}$/, "Invalid access key id format"),
  description: external_exports.string().nullable(),
  createdAt: external_exports.string(),
  lastUsedAt: external_exports.string().nullable()
});
var s3AccessKeyWithSecretSchema = s3AccessKeySchema.extend({
  secretAccessKey: external_exports.string().length(40, "Secret must be 40 characters")
});
var createS3AccessKeyRequestSchema = external_exports.object({
  description: external_exports.string().max(200).optional()
});
var s3GatewayConfigSchema = external_exports.object({
  endpoint: external_exports.string(),
  region: external_exports.string(),
  // Whether the gateway is usable on this deployment (requires an S3-backed
  // storage provider). Defaults to true so older backends without the field
  // keep the previous cloud behavior.
  available: external_exports.boolean().default(true)
});

// node_modules/@insforge/shared-schemas/dist/auth.schema.js
var userIdSchema = external_exports.string().uuid("Invalid user ID format");
var emailSchema = external_exports.string().email("Invalid email format").toLowerCase().trim();
var passwordSchema = external_exports.string();
var nameSchema = external_exports.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters");
var usernameSchema = external_exports.string().trim().min(1, "Username is required").max(100, "Username must be at most 100 characters");
var roleSchema = external_exports.enum(["anon", "authenticated", "project_admin"]);
var verificationMethodSchema = external_exports.enum(["code", "link"]);
var profileSchema = external_exports.object({
  name: external_exports.string().optional(),
  avatar_url: external_exports.string().url().optional()
}).passthrough();
var userSchema = external_exports.object({
  id: userIdSchema,
  email: emailSchema,
  emailVerified: external_exports.boolean(),
  providers: external_exports.array(external_exports.string()).optional(),
  createdAt: external_exports.string(),
  // PostgreSQL timestamp
  updatedAt: external_exports.string(),
  // PostgreSQL timestamp
  profile: profileSchema.nullable(),
  // User profile data (name, avatar_url, bio, etc.)
  metadata: external_exports.record(external_exports.unknown()).nullable()
  // System metadata (device ID, login IP, etc.)
});
var adminSchema = external_exports.object({
  sub: external_exports.string().min(1)
});
var oAuthProvidersSchema = external_exports.enum([
  "google",
  "github",
  "discord",
  "linkedin",
  "facebook",
  "instagram",
  "tiktok",
  "apple",
  "x",
  "spotify",
  "microsoft"
]);
var oAuthStateSchema = external_exports.object({
  provider: oAuthProvidersSchema,
  redirectUri: external_exports.string().url().optional()
});
var oAuthConfigSchema = external_exports.object({
  id: external_exports.string().uuid(),
  provider: oAuthProvidersSchema,
  clientId: external_exports.string().optional(),
  scopes: external_exports.array(external_exports.string()).optional(),
  redirectUri: external_exports.string().optional(),
  useSharedKey: external_exports.boolean(),
  createdAt: external_exports.string(),
  // PostgreSQL timestamp
  updatedAt: external_exports.string()
  // PostgreSQL timestamp
});
var allowedRedirectUrlsRegex = /^(?:(?:https?:\/\/)(?:(?=[^\s/:?#]*[a-zA-Z0-9])(?:(?:\*\.)?[^\s/:?#*[\]]*(?:\*[^\s/:?#*[\]]*)*|(?:\*\.)?[^\s/:?#]+)|\[[0-9A-Fa-f:.]+\])(?::\d+)?(?:\/[^\s]*)?|(?!(?:https?|javascript|data|file|vbscript):)[a-zA-Z][a-zA-Z0-9+.-]*:(?:\/\/[^\s/]+(?:\/[^\s]*)?|\/[^\s]*))$/i;
var authConfigSchema = external_exports.object({
  id: external_exports.string().uuid(),
  requireEmailVerification: external_exports.boolean(),
  passwordMinLength: external_exports.number().min(4).max(128),
  requireNumber: external_exports.boolean(),
  requireLowercase: external_exports.boolean(),
  requireUppercase: external_exports.boolean(),
  requireSpecialChar: external_exports.boolean(),
  verifyEmailMethod: verificationMethodSchema,
  resetPasswordMethod: verificationMethodSchema,
  allowedRedirectUrls: external_exports.array(external_exports.string().regex(allowedRedirectUrlsRegex, { message: "Invalid URL or wildcard URL" })).optional().nullable(),
  // When true, public sign-up endpoints (POST /api/auth/users and first-time OAuth)
  // are rejected. Admin-authenticated user creation is unaffected.
  disableSignup: external_exports.boolean(),
  createdAt: external_exports.string(),
  // PostgreSQL timestamp
  updatedAt: external_exports.string()
  // PostgreSQL timestamp
});
var smtpConfigSchema = external_exports.object({
  id: external_exports.string().uuid(),
  enabled: external_exports.boolean(),
  host: external_exports.string(),
  port: external_exports.number().int(),
  username: external_exports.string(),
  hasPassword: external_exports.boolean(),
  // Never expose actual password
  senderEmail: external_exports.string(),
  senderName: external_exports.string(),
  minIntervalSeconds: external_exports.number().int().min(0),
  createdAt: external_exports.string(),
  updatedAt: external_exports.string()
});
var emailTemplateSchema = external_exports.object({
  id: external_exports.string().uuid(),
  templateType: external_exports.string(),
  subject: external_exports.string(),
  bodyHtml: external_exports.string(),
  createdAt: external_exports.string(),
  updatedAt: external_exports.string()
});
var tokenPayloadSchema = external_exports.object({
  sub: external_exports.string().min(1),
  // Subject: user ID for users, namespaced subject for project admins
  email: emailSchema.optional(),
  role: roleSchema,
  iat: external_exports.number().optional(),
  // Issued at
  exp: external_exports.number().optional()
  // Expiration
});
var customOAuthKeySchema = external_exports.string().min(1).max(64).regex(/^[a-z0-9_-]+$/, "Key must contain only lowercase letters, numbers, hyphens, and underscores");
var customOAuthConfigSchema = external_exports.object({
  id: external_exports.string().uuid(),
  key: customOAuthKeySchema,
  name: external_exports.string().min(1),
  discoveryEndpoint: external_exports.string().url(),
  clientId: external_exports.string().min(1),
  createdAt: external_exports.string(),
  updatedAt: external_exports.string()
});

// node_modules/@insforge/shared-schemas/dist/auth-api.schema.js
var paginationSchema = external_exports.object({
  limit: external_exports.string().optional(),
  offset: external_exports.string().optional()
});
var sixDigitCodeSchema = (label) => external_exports.string().regex(/^\d{6}$/, `${label} must be a 6-digit numeric code`);
var createUserRequestSchema = external_exports.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema.optional(),
  redirectTo: external_exports.string().url().optional(),
  autoConfirm: external_exports.boolean().optional()
});
var passwordSessionRequestSchema = external_exports.object({
  method: external_exports.literal("password"),
  email: emailSchema,
  password: passwordSchema
});
var otpSessionRequestSchema = external_exports.object({
  method: external_exports.literal("otp"),
  email: emailSchema,
  otp: sixDigitCodeSchema("OTP code"),
  name: nameSchema.optional()
});
var createSessionRequestSchema = external_exports.preprocess((value2) => {
  if (!value2 || typeof value2 !== "object" || Array.isArray(value2)) {
    return value2;
  }
  const record = value2;
  if (record.method === void 0 || record.method === null) {
    return { ...record, method: "password" };
  }
  return value2;
}, external_exports.discriminatedUnion("method", [passwordSessionRequestSchema, otpSessionRequestSchema]));
var sendOTPRequestSchema = external_exports.object({
  email: emailSchema
});
var createAdminSessionRequestSchema = external_exports.object({
  username: usernameSchema,
  password: passwordSchema
});
var refreshSessionRequestSchema = external_exports.object({
  refreshToken: external_exports.string().min(1, "refreshToken is required")
});
var exchangeAdminSessionRequestSchema = external_exports.object({
  code: external_exports.string()
});
var listUsersRequestSchema = paginationSchema.extend({
  search: external_exports.string().optional()
}).optional();
var deleteUsersRequestSchema = external_exports.object({
  userIds: external_exports.array(userIdSchema).min(1, "At least one user ID is required")
});
var updateProfileRequestSchema = external_exports.object({
  profile: external_exports.record(external_exports.unknown())
});
var sendVerificationEmailRequestSchema = external_exports.object({
  email: emailSchema,
  redirectTo: external_exports.string().url().optional()
});
var verifyEmailRequestSchema = external_exports.object({
  email: emailSchema,
  otp: sixDigitCodeSchema("OTP code")
});
var sendResetPasswordEmailRequestSchema = external_exports.object({
  email: emailSchema,
  redirectTo: external_exports.string().url().optional()
});
var exchangeResetPasswordTokenRequestSchema = external_exports.object({
  email: emailSchema,
  code: sixDigitCodeSchema("Reset password code")
});
var resetPasswordRequestSchema = external_exports.object({
  newPassword: passwordSchema,
  otp: external_exports.string().min(1, "OTP/token is required")
});
var createUserResponseSchema = external_exports.object({
  user: userSchema.optional(),
  accessToken: external_exports.string().nullable(),
  requireEmailVerification: external_exports.boolean().optional(),
  csrfToken: external_exports.string().nullable().optional(),
  refreshToken: external_exports.string().optional()
  // For mobile/desktop clients (no cookies)
});
var createSessionResponseSchema = external_exports.object({
  user: userSchema,
  accessToken: external_exports.string(),
  csrfToken: external_exports.string().nullable().optional(),
  refreshToken: external_exports.string().optional()
  // For mobile/desktop clients (no cookies)
});
var verifyEmailResponseSchema = external_exports.object({
  user: userSchema,
  accessToken: external_exports.string(),
  csrfToken: external_exports.string().nullable().optional(),
  refreshToken: external_exports.string().optional()
  // For mobile/desktop clients (no cookies)
});
var refreshSessionResponseSchema = external_exports.object({
  accessToken: external_exports.string(),
  user: userSchema,
  csrfToken: external_exports.string().optional(),
  // For web clients (cookie-based)
  refreshToken: external_exports.string().optional()
  // For mobile/desktop clients (no cookies)
});
var exchangeResetPasswordTokenResponseSchema = external_exports.object({
  token: external_exports.string(),
  expiresAt: external_exports.string().datetime()
});
var resetPasswordResponseSchema = external_exports.object({
  message: external_exports.string()
});
var createAdminSessionResponseSchema = external_exports.object({
  admin: adminSchema,
  accessToken: external_exports.string(),
  csrfToken: external_exports.string().nullable().optional(),
  refreshToken: external_exports.string().optional()
});
var getCurrentSessionResponseSchema = external_exports.object({
  user: userSchema
});
var getCurrentAdminSessionResponseSchema = external_exports.object({
  admin: adminSchema
});
var getProfileResponseSchema = external_exports.object({
  id: userIdSchema,
  profile: profileSchema.nullable()
});
var listUsersResponseSchema = external_exports.object({
  data: external_exports.array(userSchema),
  pagination: external_exports.object({
    offset: external_exports.number(),
    limit: external_exports.number(),
    total: external_exports.number()
  })
});
var deleteUsersResponseSchema = external_exports.object({
  message: external_exports.string(),
  deletedCount: external_exports.number().int().nonnegative()
});
var getOauthUrlResponseSchema = external_exports.object({
  authUrl: external_exports.string().url()
});
var createOAuthConfigRequestSchema = oAuthConfigSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  clientSecret: external_exports.string().optional()
});
var updateOAuthConfigRequestSchema = oAuthConfigSchema.omit({
  id: true,
  provider: true,
  createdAt: true,
  updatedAt: true
}).extend({
  clientSecret: external_exports.string().optional()
}).partial();
var pkceRegex = /^[A-Za-z0-9._~-]+$/;
var oAuthInitRequestSchema = external_exports.object({
  redirect_uri: external_exports.string({ required_error: "Redirect URI is required" }).url(),
  code_challenge: external_exports.string().min(43, "Code challenge must be at least 43 characters").max(128, "Code challenge must be at most 128 characters").regex(pkceRegex, "Code challenge must be base64url encoded")
}).catchall(external_exports.string());
var oAuthCodeExchangeRequestSchema = external_exports.object({
  code: external_exports.string().min(1, "Exchange code is required"),
  code_verifier: external_exports.string().min(43, "Code verifier must be at least 43 characters").max(128, "Code verifier must be at most 128 characters").regex(pkceRegex, "Code verifier must be base64url encoded")
});
var listOAuthConfigsResponseSchema = external_exports.object({
  data: external_exports.array(oAuthConfigSchema),
  count: external_exports.number()
});
var updateAuthConfigRequestSchema = authConfigSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).partial();
var adminSmtpMetadataSchema = smtpConfigSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var authConfigAdminResponseSchema = external_exports.object({
  oAuthProviders: external_exports.array(oAuthProvidersSchema),
  customOAuthProviders: external_exports.array(customOAuthKeySchema),
  smtpConfig: adminSmtpMetadataSchema,
  ...authConfigSchema.omit({
    id: true,
    updatedAt: true,
    createdAt: true
  }).shape
});
var getPublicAuthConfigResponseSchema = authConfigAdminResponseSchema.omit({
  allowedRedirectUrls: true,
  smtpConfig: true
});
var upsertSmtpConfigRequestSchema = external_exports.object({
  enabled: external_exports.boolean(),
  host: external_exports.string().default(""),
  port: external_exports.union([external_exports.literal(25), external_exports.literal(465), external_exports.literal(587), external_exports.literal(2525)], {
    errorMap: () => ({ message: "Port must be one of: 25, 465, 587, 2525" })
  }),
  username: external_exports.string().default(""),
  password: external_exports.string().min(1, "SMTP password is required").optional(),
  senderEmail: external_exports.string().default(""),
  senderName: external_exports.string().default(""),
  minIntervalSeconds: external_exports.number().int().min(0).default(60)
}).superRefine((data, ctx) => {
  if (!data.enabled) {
    return;
  }
  if (data.host.length < 1) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["host"],
      message: "SMTP host is required"
    });
  }
  if (data.username.length < 1) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["username"],
      message: "SMTP username is required"
    });
  }
  if (!external_exports.string().email().safeParse(data.senderEmail).success) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["senderEmail"],
      message: "Invalid sender email"
    });
  }
  if (data.senderName.length < 1) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["senderName"],
      message: "Sender name is required"
    });
  }
});
var updateEmailTemplateRequestSchema = external_exports.object({
  subject: external_exports.string().min(1, "Subject is required"),
  bodyHtml: external_exports.string().min(1, "Template body is required")
});
var listEmailTemplatesResponseSchema = external_exports.object({
  data: external_exports.array(emailTemplateSchema)
});
var authErrorResponseSchema = external_exports.object({
  error: external_exports.string(),
  message: external_exports.string(),
  statusCode: external_exports.number().int(),
  nextActions: external_exports.string().optional()
});
var createCustomOAuthConfigRequestSchema = customOAuthConfigSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
  clientSecret: external_exports.string().min(1, "Client secret is required")
});
var updateCustomOAuthConfigRequestSchema = customOAuthConfigSchema.omit({ id: true, key: true, createdAt: true, updatedAt: true }).extend({
  clientSecret: external_exports.string().min(1).optional()
}).partial();
var listCustomOAuthConfigsResponseSchema = external_exports.object({
  data: external_exports.array(customOAuthConfigSchema),
  count: external_exports.number()
});

// node_modules/@insforge/shared-schemas/dist/realtime.schema.js
var senderTypeSchema = external_exports.enum(["system", "user"]);
var realtimeChannelSchema = external_exports.object({
  id: external_exports.string().uuid(),
  pattern: external_exports.string().min(1),
  description: external_exports.string().nullable(),
  webhookUrls: external_exports.array(external_exports.string().url()).nullable(),
  enabled: external_exports.boolean(),
  createdAt: external_exports.string().datetime(),
  updatedAt: external_exports.string().datetime()
});
var realtimeMessageSchema = external_exports.object({
  id: external_exports.string().uuid(),
  eventName: external_exports.string().min(1),
  channelId: external_exports.string().uuid().nullable(),
  channelName: external_exports.string().min(1),
  payload: external_exports.record(external_exports.string(), external_exports.unknown()),
  senderType: senderTypeSchema,
  senderId: external_exports.string().uuid().nullable(),
  wsAudienceCount: external_exports.number().int().min(0),
  whAudienceCount: external_exports.number().int().min(0),
  whDeliveredCount: external_exports.number().int().min(0),
  createdAt: external_exports.string().datetime()
});
var realtimeConfigSchema = external_exports.object({
  retentionDays: external_exports.number().int().positive().nullable()
});
var subscribeChannelPayloadSchema = external_exports.object({
  channel: external_exports.string().min(1)
  // The resolved channel instance, e.g., "order:123"
});
var unsubscribeChannelPayloadSchema = external_exports.object({
  channel: external_exports.string().min(1)
  // The resolved channel instance, e.g., "order:123"
});
var publishEventPayloadSchema = external_exports.object({
  channel: external_exports.string().min(1),
  event: external_exports.string().min(1),
  payload: external_exports.record(external_exports.string(), external_exports.unknown())
});
var presenceIdentityTypeSchema = external_exports.enum(["user", "anonymous"]);
var basePresenceMemberSchema = external_exports.object({
  presenceId: external_exports.string().min(1),
  joinedAt: external_exports.string().datetime()
});
var presenceUserMemberSchema = basePresenceMemberSchema.extend({
  type: external_exports.literal("user")
});
var presenceAnonymousMemberSchema = basePresenceMemberSchema.extend({
  type: external_exports.literal("anonymous")
});
var presenceMemberSchema = external_exports.discriminatedUnion("type", [
  presenceUserMemberSchema,
  presenceAnonymousMemberSchema
]);
var presenceSnapshotSchema = external_exports.object({
  members: external_exports.array(presenceMemberSchema)
});
var subscribeResponseSchema = external_exports.discriminatedUnion("ok", [
  external_exports.object({
    ok: external_exports.literal(true),
    channel: external_exports.string().min(1),
    presence: presenceSnapshotSchema
  }),
  external_exports.object({
    ok: external_exports.literal(false),
    channel: external_exports.string().min(1),
    error: external_exports.object({
      code: external_exports.string().min(1),
      message: external_exports.string().min(1)
    })
  })
]);
var realtimeErrorPayloadSchema = external_exports.object({
  channel: external_exports.string().optional(),
  code: external_exports.string().min(1),
  message: external_exports.string().min(1)
});
var webhookMessageSchema = external_exports.object({
  messageId: external_exports.string().uuid(),
  channel: external_exports.string().min(1),
  eventName: external_exports.string().min(1),
  payload: external_exports.record(external_exports.string(), external_exports.unknown())
});
var socketMessageMetaSchema = external_exports.object({
  channel: external_exports.string().optional(),
  // Present for room broadcasts
  messageId: external_exports.string().uuid(),
  senderType: senderTypeSchema,
  senderId: external_exports.string().uuid().optional(),
  timestamp: external_exports.string().datetime()
});
var socketMessageSchema = external_exports.object({
  meta: socketMessageMetaSchema
}).passthrough();
var presenceJoinMessageSchema = socketMessageSchema.extend({
  member: presenceMemberSchema
});
var presenceLeaveMessageSchema = socketMessageSchema.extend({
  member: presenceMemberSchema
});

// node_modules/@insforge/shared-schemas/dist/realtime-api.schema.js
var createChannelRequestSchema = external_exports.object({
  pattern: external_exports.string().min(1, "Channel pattern is required"),
  description: external_exports.string().optional(),
  webhookUrls: external_exports.array(external_exports.string().url()).optional(),
  enabled: external_exports.boolean().optional().default(true)
});
var updateChannelRequestSchema = external_exports.object({
  pattern: external_exports.string().min(1).optional(),
  description: external_exports.string().optional(),
  webhookUrls: external_exports.array(external_exports.string().url()).optional(),
  enabled: external_exports.boolean().optional()
});
var listChannelsResponseSchema = external_exports.array(realtimeChannelSchema);
var deleteChannelResponseSchema = external_exports.object({
  message: external_exports.string()
});
var listMessagesRequestSchema = external_exports.object({
  channelId: external_exports.string().uuid().optional(),
  eventName: external_exports.string().optional(),
  limit: external_exports.coerce.number().int().min(1).max(1e3).optional().default(100),
  offset: external_exports.coerce.number().int().min(0).optional().default(0)
});
var listMessagesResponseSchema = external_exports.array(realtimeMessageSchema);
var clearRealtimeMessagesResponseSchema = external_exports.object({
  deleted: external_exports.number().int().min(0)
});
var messageStatsRequestSchema = external_exports.object({
  channelId: external_exports.string().uuid().optional(),
  since: external_exports.coerce.date().optional()
});
var messageStatsResponseSchema = external_exports.object({
  totalMessages: external_exports.number().int().min(0),
  whDeliveryRate: external_exports.number().min(0).max(1),
  topEvents: external_exports.array(external_exports.object({
    eventName: external_exports.string(),
    count: external_exports.number().int().min(0)
  })),
  retentionDays: realtimeConfigSchema.shape.retentionDays
});
var rlsPolicySchema = external_exports.object({
  policyName: external_exports.string(),
  tableName: external_exports.string(),
  command: external_exports.string(),
  roles: external_exports.array(external_exports.string()),
  using: external_exports.string().nullable(),
  withCheck: external_exports.string().nullable()
});
var realtimePermissionsResponseSchema = external_exports.object({
  subscribe: external_exports.object({
    policies: external_exports.array(rlsPolicySchema)
  }),
  publish: external_exports.object({
    policies: external_exports.array(rlsPolicySchema)
  })
});

// node_modules/@insforge/shared-schemas/dist/metadata.schema.js
var authMetadataSchema = authConfigAdminResponseSchema;
var databaseMetadataSchema = external_exports.object({
  tables: external_exports.array(external_exports.object({
    tableName: external_exports.string(),
    recordCount: external_exports.number()
  })),
  totalSizeInGB: external_exports.number(),
  hint: external_exports.string().optional()
});
var bucketMetadataSchema = storageBucketSchema.extend({
  objectCount: external_exports.number().optional()
});
var storageMetadataSchema = external_exports.object({
  buckets: external_exports.array(bucketMetadataSchema),
  totalSizeInGB: external_exports.number()
});
var edgeFunctionMetadataSchema = external_exports.object({
  slug: external_exports.string(),
  name: external_exports.string(),
  description: external_exports.string().nullable(),
  status: external_exports.string()
});
var realtimeMetadataSchema = external_exports.object({
  channels: external_exports.array(realtimeChannelSchema),
  permissions: realtimePermissionsResponseSchema
});
var deploymentsMetadataSchema = external_exports.object({
  customSlug: external_exports.string().nullable()
});
var appMetaDataSchema = external_exports.object({
  auth: authMetadataSchema,
  database: databaseMetadataSchema,
  storage: storageMetadataSchema,
  functions: external_exports.array(edgeFunctionMetadataSchema),
  realtime: realtimeMetadataSchema.optional(),
  deployments: deploymentsMetadataSchema.optional(),
  version: external_exports.string().optional()
});
var databaseConnectionParametersSchema = external_exports.object({
  host: external_exports.string(),
  port: external_exports.number(),
  database: external_exports.string(),
  user: external_exports.string(),
  password: external_exports.string(),
  sslmode: external_exports.string()
});
var databaseConnectionInfoSchema = external_exports.object({
  connectionURL: external_exports.string(),
  parameters: databaseConnectionParametersSchema
});
var databasePasswordInfoSchema = external_exports.object({
  databasePassword: external_exports.string()
});
var apiKeyResponseSchema = external_exports.object({
  apiKey: external_exports.string()
});
var anonKeyResponseSchema = external_exports.object({
  anonKey: external_exports.string()
});
var projectIdResponseSchema = external_exports.object({
  projectId: external_exports.string().nullable()
});

// node_modules/@insforge/shared-schemas/dist/ai.schema.js
var modalitySchema = external_exports.string().min(1);

// node_modules/@insforge/shared-schemas/dist/ai-api.schema.js
var DEFAULT_MAX_TOKENS_CAP = 16384;
var getMaxTokensCap = () => {
  if (typeof process !== "undefined" && process.env && process.env.MAX_COMPLETION_TOKENS) {
    const parsed = Number(process.env.MAX_COMPLETION_TOKENS);
    if (Number.isInteger(parsed) && parsed > 0)
      return parsed;
  }
  return DEFAULT_MAX_TOKENS_CAP;
};
var textContentSchema = external_exports.object({
  type: external_exports.literal("text"),
  text: external_exports.string()
});
var imageContentSchema = external_exports.object({
  type: external_exports.literal("image_url"),
  image_url: external_exports.object({
    // URL can be either a public URL or base64-encoded data URI
    // Examples:
    // - Public URL: "https://example.com/image.jpg"
    // - Base64: "data:image/jpeg;base64,/9j/4AAQ..."
    url: external_exports.string(),
    detail: external_exports.enum(["auto", "low", "high"]).optional()
  })
});
var audioContentSchema = external_exports.object({
  type: external_exports.literal("input_audio"),
  input_audio: external_exports.object({
    // Base64-encoded audio data (direct URLs not supported for audio)
    data: external_exports.string(),
    format: external_exports.enum(["wav", "mp3", "aiff", "aac", "ogg", "flac", "m4a"])
  })
});
var fileContentSchema = external_exports.object({
  type: external_exports.literal("file"),
  file: external_exports.object({
    // Filename with extension (e.g., "document.pdf")
    filename: external_exports.string(),
    // File data can be:
    // - Public URL: "https://example.com/document.pdf"
    // - Base64 data URL: "data:application/pdf;base64,..."
    file_data: external_exports.string()
  })
});
var contentSchema = external_exports.union([
  textContentSchema,
  imageContentSchema,
  audioContentSchema,
  fileContentSchema
]);
var toolFunctionSchema = external_exports.object({
  name: external_exports.string(),
  description: external_exports.string().optional(),
  parameters: external_exports.record(external_exports.unknown()).optional()
});
var toolSchema = external_exports.object({
  type: external_exports.literal("function"),
  function: toolFunctionSchema
});
var toolChoiceSchema = external_exports.union([
  external_exports.enum(["auto", "none", "required"]),
  external_exports.object({
    type: external_exports.literal("function"),
    function: external_exports.object({ name: external_exports.string() })
  })
]);
var toolCallSchema = external_exports.object({
  id: external_exports.string(),
  type: external_exports.literal("function"),
  function: external_exports.object({
    name: external_exports.string(),
    arguments: external_exports.string()
  })
});
var chatMessageSchema = external_exports.object({
  role: external_exports.enum(["user", "assistant", "system", "tool"]),
  // Content can be a string or an array of content parts (OpenAI-compatible).
  // Nullable AND optional so an assistant tool-call message may omit it (per the
  // per-role rule enforced below); `formatMessages` coerces a missing assistant
  // content to null.
  content: external_exports.union([external_exports.string(), external_exports.array(contentSchema)]).nullish(),
  // Legacy format: separate images field (deprecated but supported for backward compatibility)
  images: external_exports.array(external_exports.object({ url: external_exports.string() })).optional(),
  // Tool calls made by the assistant
  tool_calls: external_exports.array(toolCallSchema).optional(),
  // Tool call ID for tool response messages
  tool_call_id: external_exports.string().optional()
}).superRefine((message, ctx) => {
  if (message.role !== "assistant" && message.content === void 0) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["content"],
      message: `content is required for ${message.role} messages`
    });
  }
});
var webSearchPluginSchema = external_exports.object({
  enabled: external_exports.boolean(),
  // Engine selection:
  // - "native": Always use provider's built-in web search (OpenAI, Anthropic, Perplexity, xAI)
  // - "exa": Use Exa's search API
  // - undefined: Auto-select (native if available, otherwise Exa)
  engine: external_exports.enum(["native", "exa"]).optional(),
  // Maximum number of search results (1-10, default: 5)
  maxResults: external_exports.number().min(1).max(10).optional(),
  // Custom prompt for attaching search results to the message
  searchPrompt: external_exports.string().optional()
});
var fileParserPluginSchema = external_exports.object({
  enabled: external_exports.boolean(),
  pdf: external_exports.object({
    // PDF processing engine:
    // - "pdf-text": Best for well-structured PDFs with clear text content (Free)
    // - "mistral-ocr": Best for scanned documents or PDFs with images ($2 per 1,000 pages)
    // - "native": Only available for models that support file input natively (charged as input tokens)
    // If not specified, defaults to native if available, otherwise mistral-ocr
    engine: external_exports.enum(["pdf-text", "mistral-ocr", "native"]).optional()
  }).optional()
});
var chatCompletionRequestSchema = external_exports.object({
  model: external_exports.string(),
  messages: external_exports.array(chatMessageSchema),
  temperature: external_exports.number().min(0).max(2).optional(),
  // Cap output tokens to prevent abuse. Configurable via MAX_COMPLETION_TOKENS env var, defaults to 16,384.
  // Evaluated lazily per-request so dotenv loading order does not affect the cap.
  maxTokens: external_exports.number().int().positive().optional().refine((val) => val === void 0 || val <= getMaxTokensCap(), {
    message: "Exceeds configured maximum token cap."
  }),
  topP: external_exports.number().min(0).max(1).optional(),
  stream: external_exports.boolean().optional(),
  // Web Search: Incorporate relevant web search results into the response
  // Results are returned in the annotations field
  webSearch: webSearchPluginSchema.optional(),
  // File Parser: Configure PDF processing for file content in messages
  // When files are included in messages, this controls how PDFs are parsed
  fileParser: fileParserPluginSchema.optional(),
  // Thinking/Reasoning mode: Enable extended reasoning capabilities
  // Appends ":thinking" to the model ID for chain-of-thought reasoning
  thinking: external_exports.boolean().optional(),
  // Tool calling: Define functions the AI can call
  tools: external_exports.array(toolSchema).optional(),
  // Tool choice: Control whether/which tool is called ('auto', 'none', 'required', or specific function)
  toolChoice: toolChoiceSchema.optional(),
  // Parallel tool calls: Allow the model to call multiple tools in parallel
  parallelToolCalls: external_exports.boolean().optional()
});
var urlCitationAnnotationSchema = external_exports.object({
  type: external_exports.literal("url_citation"),
  urlCitation: external_exports.object({
    url: external_exports.string(),
    title: external_exports.string().optional(),
    content: external_exports.string().optional(),
    // Character indices in the response text where this citation applies
    startIndex: external_exports.number().optional(),
    endIndex: external_exports.number().optional()
  })
});
var fileAnnotationSchema = external_exports.object({
  type: external_exports.literal("file"),
  file: external_exports.object({
    filename: external_exports.string(),
    // Parsed content from the PDF (used for caching)
    parsedContent: external_exports.string().optional(),
    // Additional metadata from the parser
    metadata: external_exports.record(external_exports.unknown()).optional()
  })
});
var annotationSchema = external_exports.union([urlCitationAnnotationSchema, fileAnnotationSchema]);
var chatCompletionResponseSchema = external_exports.object({
  text: external_exports.string(),
  // Tool calls from the assistant (present when the model invokes tools)
  tool_calls: external_exports.array(toolCallSchema).optional(),
  // Annotations from web search or file parsing (can be URL citations or file annotations)
  annotations: external_exports.array(annotationSchema).optional(),
  metadata: external_exports.object({
    model: external_exports.string(),
    usage: external_exports.object({
      promptTokens: external_exports.number().optional(),
      completionTokens: external_exports.number().optional(),
      totalTokens: external_exports.number().optional()
    }).optional()
  }).optional()
});
var embeddingsRequestSchema = external_exports.object({
  model: external_exports.string(),
  input: external_exports.union([external_exports.string(), external_exports.array(external_exports.string())]),
  encoding_format: external_exports.enum(["float", "base64"]).optional(),
  dimensions: external_exports.number().int().min(0).optional()
});
var embeddingObjectSchema = external_exports.object({
  object: external_exports.literal("embedding"),
  // Embedding can be number[] (float format) or string (base64 format)
  embedding: external_exports.union([external_exports.array(external_exports.number()), external_exports.string()]),
  index: external_exports.number()
});
var embeddingsResponseSchema = external_exports.object({
  object: external_exports.literal("list"),
  data: external_exports.array(embeddingObjectSchema),
  metadata: external_exports.object({
    model: external_exports.string(),
    usage: external_exports.object({
      promptTokens: external_exports.number().optional(),
      totalTokens: external_exports.number().optional()
    }).optional()
  }).optional()
});
var imageGenerationRequestSchema = external_exports.object({
  model: external_exports.string(),
  prompt: external_exports.string(),
  images: external_exports.array(external_exports.object({
    url: external_exports.string()
  })).optional()
});
var imageGenerationResponseSchema = external_exports.object({
  text: external_exports.string().optional(),
  images: external_exports.array(external_exports.object({
    type: external_exports.literal("imageUrl"),
    imageUrl: external_exports.string()
  })),
  metadata: external_exports.object({
    model: external_exports.string(),
    usage: external_exports.object({
      promptTokens: external_exports.number().optional(),
      completionTokens: external_exports.number().optional(),
      totalTokens: external_exports.number().optional()
    }).optional()
  }).optional()
});
var aiModelSchema = external_exports.object({
  id: external_exports.string(),
  created: external_exports.number().optional(),
  inputModality: external_exports.array(modalitySchema).min(1),
  outputModality: external_exports.array(modalitySchema).min(1),
  provider: external_exports.string(),
  modelId: external_exports.string(),
  inputPrice: external_exports.number().min(0).optional(),
  // Price per million tokens in USD
  outputPrice: external_exports.number().min(0).optional(),
  // Price per million tokens in USD
  inputPriceLabel: external_exports.string().optional(),
  outputPriceLabel: external_exports.string().optional()
});
var aiOverviewMetricPointSchema = external_exports.object({
  label: external_exports.string(),
  value: external_exports.number()
});
var aiModelUsageSchema = external_exports.object({
  model: external_exports.string(),
  providers: external_exports.array(external_exports.string()),
  requests: external_exports.number(),
  promptTokens: external_exports.number(),
  completionTokens: external_exports.number(),
  reasoningTokens: external_exports.number(),
  totalTokens: external_exports.number(),
  spend: external_exports.number(),
  byokSpend: external_exports.number()
});
var aiOverviewSchema = external_exports.object({
  key: external_exports.object({
    label: external_exports.string().optional(),
    limit: external_exports.number().nullable(),
    limitRemaining: external_exports.number().nullable(),
    limitReset: external_exports.string().nullable().optional(),
    usage: external_exports.number(),
    usageDaily: external_exports.number(),
    usageWeekly: external_exports.number(),
    usageMonthly: external_exports.number(),
    isFreeTier: external_exports.boolean().optional(),
    observabilityAvailable: external_exports.boolean(),
    observabilityError: external_exports.string().optional()
  }),
  charts: external_exports.object({
    spend: external_exports.array(aiOverviewMetricPointSchema),
    requests: external_exports.array(aiOverviewMetricPointSchema),
    tokens: external_exports.array(aiOverviewMetricPointSchema)
  }),
  // Optional for compatibility while cloud backends and dashboards roll out independently.
  modelUsage: external_exports.array(aiModelUsageSchema).optional()
});
var openRouterKeySchema = external_exports.object({
  apiKey: external_exports.string(),
  maskedKey: external_exports.string()
});
var modelGatewayCredentialStatusSchema = external_exports.object({
  configured: external_exports.boolean(),
  maskedKey: external_exports.string().nullable()
});
var modelGatewayConfigSchema = external_exports.object({
  apiKey: modelGatewayCredentialStatusSchema,
  managementKey: modelGatewayCredentialStatusSchema
});
var updateModelGatewayConfigSchema = external_exports.object({
  apiKey: external_exports.string().trim().min(1).max(512).optional(),
  managementKey: external_exports.string().trim().min(1).max(512).optional()
}).refine((value2) => value2.apiKey !== void 0 || value2.managementKey !== void 0, {
  message: "At least one credential is required"
});

// node_modules/@insforge/shared-schemas/dist/logs.schema.js
var auditLogSchema = external_exports.object({
  id: external_exports.string(),
  actor: external_exports.string(),
  action: external_exports.string(),
  module: external_exports.string(),
  details: external_exports.record(external_exports.unknown()).nullable(),
  ipAddress: external_exports.string().nullable(),
  createdAt: external_exports.string(),
  updatedAt: external_exports.string()
});
var logSourceSchema = external_exports.object({
  id: external_exports.string(),
  name: external_exports.string(),
  token: external_exports.string()
});
var logSchema = external_exports.object({
  id: external_exports.string(),
  eventMessage: external_exports.string(),
  timestamp: external_exports.string(),
  body: external_exports.record(external_exports.string(), external_exports.unknown()),
  source: external_exports.string().optional()
});
var logStatsSchema = external_exports.object({
  source: external_exports.string(),
  count: external_exports.number(),
  lastActivity: external_exports.string()
});
var buildLogEntrySchema = external_exports.object({
  level: external_exports.string(),
  message: external_exports.string()
});
var getBuildLogsResponseSchema = external_exports.object({
  deploymentId: external_exports.string(),
  status: external_exports.enum(["pending", "success", "failed"]),
  logs: external_exports.array(buildLogEntrySchema),
  createdAt: external_exports.string()
});

// node_modules/@insforge/shared-schemas/dist/logs-api.schema.js
var getAuditLogsRequestSchema = external_exports.object({
  limit: external_exports.number().default(100),
  offset: external_exports.number().default(0),
  actor: external_exports.string().optional(),
  action: external_exports.string().optional(),
  module: external_exports.string().optional(),
  startDate: external_exports.string().optional(),
  endDate: external_exports.string().optional()
});
var getAuditLogsResponseSchema = external_exports.object({
  data: external_exports.array(auditLogSchema),
  pagination: external_exports.object({
    limit: external_exports.number(),
    offset: external_exports.number(),
    total: external_exports.number()
  })
});
var getAuditLogStatsRequestSchema = external_exports.object({
  days: external_exports.number().default(7)
});
var getAuditLogStatsResponseSchema = external_exports.object({
  totalLogs: external_exports.number(),
  uniqueActors: external_exports.number(),
  uniqueModules: external_exports.number(),
  actionsByModule: external_exports.record(external_exports.number()),
  recentActivity: external_exports.array(auditLogSchema)
});
var clearAuditLogsRequestSchema = external_exports.object({
  daysToKeep: external_exports.number().default(90)
});
var clearAuditLogsResponseSchema = external_exports.object({
  message: external_exports.string(),
  deleted: external_exports.number()
});
var getLogsResponseSchema = external_exports.object({
  logs: external_exports.array(logSchema),
  total: external_exports.number()
});

// node_modules/@insforge/shared-schemas/dist/functions.schema.js
var functionSchema = external_exports.object({
  id: external_exports.string(),
  slug: external_exports.string(),
  name: external_exports.string(),
  description: external_exports.string().nullable(),
  code: external_exports.string(),
  status: external_exports.enum(["draft", "active", "error"]),
  createdAt: external_exports.string(),
  updatedAt: external_exports.string(),
  deployedAt: external_exports.string().nullable()
});

// node_modules/@insforge/shared-schemas/dist/functions-api.schema.js
var uploadFunctionRequestSchema = external_exports.object({
  name: external_exports.string().min(1, "Name is required"),
  slug: external_exports.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid slug format - must be alphanumeric with hyphens or underscores only").optional(),
  code: external_exports.string().min(1),
  description: external_exports.string().optional(),
  status: external_exports.enum(["draft", "active"]).optional().default("active")
});
var updateFunctionRequestSchema = external_exports.object({
  name: external_exports.string().optional(),
  code: external_exports.string().optional(),
  description: external_exports.string().optional(),
  status: external_exports.enum(["draft", "active"]).optional()
});
var listFunctionsResponseSchema = external_exports.object({
  functions: external_exports.array(functionSchema),
  runtime: external_exports.object({
    status: external_exports.enum(["running", "unavailable"])
  }),
  deploymentUrl: external_exports.string().nullable().optional()
});
var deploymentResultSchema = external_exports.object({
  id: external_exports.string(),
  status: external_exports.enum(["success", "failed"]),
  url: external_exports.string().nullable(),
  buildLogs: external_exports.array(external_exports.string()).optional()
});
var functionResponseSchema = external_exports.object({
  success: external_exports.boolean(),
  function: functionSchema,
  deployment: deploymentResultSchema.nullable().optional()
});

// node_modules/@insforge/shared-schemas/dist/cloud-events.schema.js
var appRouteChangeEventSchema = external_exports.object({
  type: external_exports.literal("APP_ROUTE_CHANGE"),
  path: external_exports.string()
});
var authSuccessEventSchema = external_exports.object({
  type: external_exports.literal("AUTH_SUCCESS")
});
var authErrorEventSchema = external_exports.object({
  type: external_exports.literal("AUTH_ERROR"),
  message: external_exports.string()
});
var mcpConnectionStatusEventSchema = external_exports.object({
  type: external_exports.literal("MCP_CONNECTION_STATUS"),
  connected: external_exports.boolean(),
  toolName: external_exports.string(),
  timestamp: external_exports.union([external_exports.number(), external_exports.string()])
});
var showOnboardingOverlayEventSchema = external_exports.object({
  type: external_exports.literal("SHOW_ONBOARDING_OVERLAY")
});
var showSettingsOverlayEventSchema = external_exports.object({
  type: external_exports.literal("SHOW_SETTINGS_OVERLAY")
});
var onboardingSuccessSchema = external_exports.object({
  type: external_exports.literal("ONBOARDING_SUCCESS")
});
var navigateToUsageSchema = external_exports.object({
  type: external_exports.literal("NAVIGATE_TO_USAGE")
});
var showContactModalEventSchema = external_exports.object({
  type: external_exports.literal("SHOW_CONTACT_MODAL")
});
var showConnectOverlayEventSchema = external_exports.object({
  type: external_exports.literal("SHOW_CONNECT_OVERLAY")
});
var showPlanModalEventSchema = external_exports.object({
  type: external_exports.literal("SHOW_PLAN_MODAL")
});
var authorizationCodeEventSchema = external_exports.object({
  type: external_exports.literal("AUTHORIZATION_CODE"),
  code: external_exports.string()
});
var routeChangeEventSchema = external_exports.object({
  type: external_exports.literal("ROUTE_CHANGE"),
  path: external_exports.string()
});
var requestProjectInfoEventSchema = external_exports.object({
  type: external_exports.literal("REQUEST_PROJECT_INFO")
});
var projectInfoEventSchema = external_exports.object({
  type: external_exports.literal("PROJECT_INFO"),
  name: external_exports.string(),
  instanceType: external_exports.string(),
  region: external_exports.string(),
  latestVersion: external_exports.string().optional(),
  isBranch: external_exports.boolean().optional()
});
var requestInstanceInfoEventSchema = external_exports.object({
  type: external_exports.literal("REQUEST_INSTANCE_INFO")
});
var instanceInfoEventSchema = external_exports.object({
  type: external_exports.literal("INSTANCE_INFO"),
  currentInstanceType: external_exports.string(),
  planName: external_exports.string(),
  computeCredits: external_exports.number(),
  currentOrgComputeCost: external_exports.number(),
  instanceTypes: external_exports.array(external_exports.object({
    id: external_exports.string(),
    name: external_exports.string(),
    cpu: external_exports.string(),
    ram: external_exports.string(),
    pricePerHour: external_exports.number(),
    pricePerMonth: external_exports.number()
  })),
  projects: external_exports.array(external_exports.object({
    name: external_exports.string(),
    instanceType: external_exports.string(),
    monthlyCost: external_exports.number(),
    isCurrent: external_exports.boolean(),
    status: external_exports.string()
  }))
});
var requestInstanceTypeChangeEventSchema = external_exports.object({
  type: external_exports.literal("REQUEST_INSTANCE_TYPE_CHANGE"),
  instanceType: external_exports.string()
});
var instanceTypeChangeResultEventSchema = external_exports.object({
  type: external_exports.literal("INSTANCE_TYPE_CHANGE_RESULT"),
  success: external_exports.boolean(),
  instanceType: external_exports.string().optional(),
  error: external_exports.string().optional()
});
var posthogConnectionStatusEventSchema = external_exports.object({
  type: external_exports.literal("POSTHOG_CONNECTION_STATUS"),
  status: external_exports.enum(["connected", "error", "cancelled"]),
  reason: external_exports.string().optional(),
  timestamp: external_exports.number()
});
var updatePreferredLocaleEventSchema = external_exports.object({
  type: external_exports.literal("UPDATE_PREFERRED_LOCALE"),
  // Free string (not an enum) so old/new locale lists interoperate; bounded
  // to the BCP 47 max the backend column accepts.
  locale: external_exports.string().max(35)
});
var posthogConnectRequestEventSchema = external_exports.object({
  type: external_exports.literal("POSTHOG_CONNECT_REQUEST"),
  projectId: external_exports.string(),
  timestamp: external_exports.number()
});
var cloudEventSchema = external_exports.discriminatedUnion("type", [
  appRouteChangeEventSchema,
  authSuccessEventSchema,
  authErrorEventSchema,
  mcpConnectionStatusEventSchema,
  showOnboardingOverlayEventSchema,
  showSettingsOverlayEventSchema,
  onboardingSuccessSchema,
  navigateToUsageSchema,
  showContactModalEventSchema,
  showConnectOverlayEventSchema,
  showPlanModalEventSchema,
  authorizationCodeEventSchema,
  routeChangeEventSchema,
  requestProjectInfoEventSchema,
  projectInfoEventSchema,
  requestInstanceInfoEventSchema,
  instanceInfoEventSchema,
  requestInstanceTypeChangeEventSchema,
  instanceTypeChangeResultEventSchema,
  posthogConnectionStatusEventSchema,
  posthogConnectRequestEventSchema,
  updatePreferredLocaleEventSchema
]);

// node_modules/@insforge/shared-schemas/dist/docs.schema.js
var sdkFeatureSchema = external_exports.enum(["db", "storage", "functions", "auth", "ai", "realtime", "payments"]).describe(`
    SDK feature categories:

    - "db" - Database operations
    - "storage" - File storage
    - "functions" - Edge functions
    - "auth" - User authentication
    - "ai" - AI features
    - "realtime" - Real-time WebSockets
    - "payments" - Stripe Checkout, Billing Portal, Razorpay Checkout, and webhooks
    `);
var sdkLanguageSchema = external_exports.enum([
  "typescript",
  "swift",
  "kotlin",
  // 'flutter',
  "rest-api"
]).describe(`
    SDK languages:

    - "typescript" - JavaScript/TypeScript SDK
    - "swift" - Swift SDK
    - "kotlin" - Kotlin SDK
    - "rest-api" - REST API
    `);
var docTypeSchema = external_exports.enum([
  "instructions",
  "auth-sdk",
  "db-sdk",
  "storage-sdk",
  "functions-sdk",
  "ai-integration-sdk",
  "real-time",
  "deployment",
  "payments"
]).describe(`
    Documentation type:
      "instructions" (essential backend setup - use FIRST),
      "db-sdk" (database operations),
      "storage-sdk" (file storage),
      "functions-sdk" (edge functions),
      "auth-sdk" (direct SDK methods for custom auth flows),
      "ai-integration-sdk" (AI features),
      "real-time" (real-time pub/sub through WebSockets),
      "deployment" (deploy frontend applications via MCP tool),
      "payments" (Stripe Checkout, Billing Portal, Razorpay Checkout, and webhook-based fulfillment)
    `);

// node_modules/@insforge/shared-schemas/dist/email-api.schema.js
var emailOrEmails = external_exports.union([
  emailSchema,
  external_exports.array(emailSchema).min(1, "At least one email is required").max(50, "Maximum 50 recipients allowed")
]);
var sendRawEmailRequestSchema = external_exports.object({
  to: emailOrEmails,
  subject: external_exports.string().trim().min(1, "Subject is required").max(500, "Subject too long"),
  html: external_exports.string().trim().min(1, "HTML content is required"),
  cc: emailOrEmails.optional(),
  bcc: emailOrEmails.optional(),
  from: external_exports.string().trim().max(100, "From name too long").optional(),
  replyTo: external_exports.string().email("Reply-To must be a valid email").optional()
});
var sendEmailResponseSchema = external_exports.object({});

// node_modules/@insforge/shared-schemas/dist/deployments.schema.js
var deploymentStatusSchema = external_exports.enum([
  "WAITING",
  // Record created, waiting for source zip upload or direct file registration/content
  "UPLOADING",
  // File uploads or Vercel deployment creation are in progress
  "QUEUED",
  // Vercel: deployment queued
  "BUILDING",
  // Vercel: deployment building
  "READY",
  // Vercel: deployment ready
  "ERROR",
  // Vercel: deployment failed
  "CANCELED"
  // Vercel: deployment canceled
]);
var deploymentSchema = external_exports.object({
  id: external_exports.string().uuid(),
  providerDeploymentId: external_exports.string().nullable(),
  // Provider's deployment ID, null until deployment starts
  provider: external_exports.string(),
  status: deploymentStatusSchema,
  url: external_exports.string().nullable(),
  metadata: external_exports.record(external_exports.unknown()).nullable(),
  createdAt: external_exports.string().datetime(),
  updatedAt: external_exports.string().datetime()
});

// node_modules/@insforge/shared-schemas/dist/deployments-api.schema.js
var projectSettingsSchema = external_exports.object({
  buildCommand: external_exports.string().nullable().optional(),
  outputDirectory: external_exports.string().nullable().optional(),
  installCommand: external_exports.string().nullable().optional(),
  devCommand: external_exports.string().nullable().optional(),
  rootDirectory: external_exports.string().nullable().optional()
});
var envVarSchema = external_exports.object({
  key: external_exports.string(),
  value: external_exports.string()
});
var deploymentFilePathSchema = external_exports.string().min(1, "path is required").max(2048, "path is too long").refine((value2) => !value2.includes("\0"), "path cannot contain null bytes").refine((value2) => !value2.includes("\\"), "path must use forward slashes").refine((value2) => !value2.startsWith("/"), "path must be relative").refine((value2) => value2.split("/").every((part) => part !== "" && part !== "." && part !== ".."), "path cannot contain empty, current, or parent directory segments");
var deploymentManifestFileEntrySchema = external_exports.object({
  path: deploymentFilePathSchema,
  sha: external_exports.string().regex(/^[a-f0-9]{40}$/i, "sha must be a SHA-1 hex digest"),
  size: external_exports.number().int().nonnegative()
});
var deploymentManifestFileSchema = deploymentManifestFileEntrySchema.extend({
  fileId: external_exports.string().uuid(),
  uploadedAt: external_exports.string().datetime().nullable()
});
var createDeploymentResponseSchema = external_exports.object({
  id: external_exports.string().uuid(),
  uploadUrl: external_exports.string().url(),
  uploadFields: external_exports.record(external_exports.string())
});
var createDirectDeploymentRequestSchema = external_exports.object({
  files: external_exports.array(deploymentManifestFileEntrySchema).min(1)
}).superRefine(({ files }, ctx) => {
  const firstSeenByPath = /* @__PURE__ */ new Map();
  files.forEach((file, index2) => {
    const existingIndex = firstSeenByPath.get(file.path);
    if (existingIndex !== void 0) {
      ctx.addIssue({
        code: external_exports.ZodIssueCode.custom,
        message: "duplicate file path",
        path: ["files", index2, "path"]
      });
      return;
    }
    firstSeenByPath.set(file.path, index2);
  });
});
var createDirectDeploymentResponseSchema = external_exports.object({
  id: external_exports.string().uuid(),
  status: deploymentSchema.shape.status,
  files: external_exports.array(deploymentManifestFileSchema)
});
var uploadDeploymentFileResponseSchema = deploymentManifestFileSchema.extend({
  uploadedAt: external_exports.string().datetime()
});
var startDeploymentRequestSchema = external_exports.object({
  projectSettings: projectSettingsSchema.optional(),
  envVars: external_exports.array(envVarSchema).optional(),
  meta: external_exports.record(external_exports.string()).optional()
});
var listDeploymentsResponseSchema = external_exports.object({
  data: external_exports.array(deploymentSchema),
  pagination: external_exports.object({
    limit: external_exports.number(),
    offset: external_exports.number(),
    total: external_exports.number()
  })
});
var deploymentEnvVarSchema = external_exports.object({
  id: external_exports.string(),
  // Vercel env var ID (needed for delete/get)
  key: external_exports.string(),
  type: external_exports.enum(["plain", "encrypted", "secret", "sensitive", "system"]),
  updatedAt: external_exports.number().optional()
  // Unix timestamp (milliseconds)
});
var deploymentEnvVarWithValueSchema = external_exports.object({
  id: external_exports.string(),
  key: external_exports.string(),
  value: external_exports.string(),
  type: external_exports.enum(["plain", "encrypted", "secret", "sensitive", "system"]),
  updatedAt: external_exports.number().optional()
});
var listEnvVarsResponseSchema = external_exports.object({
  envVars: external_exports.array(deploymentEnvVarSchema)
});
var getEnvVarResponseSchema = external_exports.object({
  envVar: deploymentEnvVarWithValueSchema
});
var upsertEnvVarRequestSchema = external_exports.object({
  key: external_exports.string().trim().min(1, "key is required"),
  value: external_exports.string()
});
var upsertEnvVarsRequestSchema = external_exports.object({
  envVars: external_exports.array(upsertEnvVarRequestSchema).min(1)
}).superRefine(({ envVars }, ctx) => {
  const firstSeenByKey = /* @__PURE__ */ new Map();
  envVars.forEach((envVar, index2) => {
    const existingIndex = firstSeenByKey.get(envVar.key);
    if (existingIndex !== void 0) {
      ctx.addIssue({
        code: external_exports.ZodIssueCode.custom,
        message: "duplicate environment variable key",
        path: ["envVars", index2, "key"]
      });
      return;
    }
    firstSeenByKey.set(envVar.key, index2);
  });
});
var upsertEnvVarResponseSchema = external_exports.object({
  success: external_exports.literal(true),
  message: external_exports.string()
});
var upsertEnvVarsResponseSchema = external_exports.object({
  success: external_exports.literal(true),
  message: external_exports.string(),
  count: external_exports.number().int().positive()
});
var deleteEnvVarResponseSchema = external_exports.object({
  success: external_exports.literal(true),
  message: external_exports.string()
});
var updateSlugRequestSchema = external_exports.object({
  slug: external_exports.string().trim().min(3, "slug must be at least 3 characters").max(63, "slug must be at most 63 characters").regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, "slug must be lowercase alphanumeric with hyphens, not starting or ending with hyphen").nullable()
});
var updateSlugResponseSchema = external_exports.object({
  success: external_exports.boolean(),
  slug: external_exports.string().nullable(),
  domain: external_exports.string().nullable()
});
var deploymentMetadataResponseSchema = external_exports.object({
  currentDeploymentId: external_exports.string().uuid().nullable(),
  defaultDomainUrl: external_exports.string().nullable(),
  customDomainUrl: external_exports.string().nullable()
});
var domainVerificationRecordSchema = external_exports.object({
  type: external_exports.string(),
  domain: external_exports.string(),
  value: external_exports.string()
});
var customDomainSchema = external_exports.object({
  domain: external_exports.string(),
  apexDomain: external_exports.string(),
  verified: external_exports.boolean(),
  misconfigured: external_exports.boolean(),
  verification: external_exports.array(domainVerificationRecordSchema),
  cnameTarget: external_exports.string().nullable(),
  aRecordValue: external_exports.string().nullable()
});
var addCustomDomainRequestSchema = external_exports.object({
  domain: external_exports.string().trim().min(1, "Domain is required").regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i, "Invalid domain format (e.g. myapp.com or www.myapp.com)").refine((domain) => !domain.toLowerCase().endsWith(".insforge.site"), {
    message: "Domains ending with .insforge.site are reserved by InsForge"
  })
});
var listCustomDomainsResponseSchema = external_exports.object({
  domains: external_exports.array(customDomainSchema)
});

// node_modules/@insforge/shared-schemas/dist/schedules.schema.js
var scheduleSchema = external_exports.object({
  id: external_exports.string().uuid(),
  name: external_exports.string(),
  cronSchedule: external_exports.string(),
  functionUrl: external_exports.string().url(),
  httpMethod: external_exports.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  // Optional HTTP headers to include when invoking the scheduled function
  headers: external_exports.record(external_exports.string()).nullable(),
  // Body payload for the scheduled invocation. Can be a JSON object or a raw string.
  body: external_exports.union([external_exports.string(), external_exports.record(external_exports.unknown())]).nullable(),
  // cron_job_id is a BIGINT in postgres, which node-pg returns as a string.
  cronJobId: external_exports.string().nullable(),
  lastExecutedAt: external_exports.string().datetime().nullable(),
  // Whether the cron job is currently active (has a scheduled cron job)
  isActive: external_exports.boolean().default(true),
  // Next scheduled run time in ISO format (nullable if cron expression invalid)
  nextRun: external_exports.string().datetime().nullable(),
  createdAt: external_exports.string().datetime(),
  updatedAt: external_exports.string().datetime()
});
var scheduleLogSchema = external_exports.object({
  id: external_exports.string().uuid(),
  scheduleId: external_exports.string().uuid(),
  executedAt: external_exports.string().datetime(),
  statusCode: external_exports.number().int(),
  success: external_exports.boolean(),
  durationMs: external_exports.number().int(),
  message: external_exports.string().nullable()
});
var schedulesConfigSchema = external_exports.object({
  retentionDays: external_exports.number().int().positive().nullable()
});

// node_modules/@insforge/shared-schemas/dist/schedules-api.schema.js
var intervalRegex = /^\s*([1-9]|[1-5]\d)\s+seconds?\s*$/i;
var cronScheduleSchema = external_exports.string().refine((value2) => {
  if (intervalRegex.test(value2)) {
    return true;
  }
  const parts2 = value2.trim().split(/\s+/);
  return parts2.length === 5;
}, {
  message: 'Invalid cron schedule. Use 5-field cron (e.g., "*/5 * * * *") or sub-minute interval form (1\u201359 seconds, e.g., "30 seconds").'
});
var createScheduleRequestSchema = external_exports.object({
  name: external_exports.string().min(3, "Schedule name must be at least 3 characters long"),
  cronSchedule: cronScheduleSchema,
  functionUrl: external_exports.string().url("The function URL must be a valid URL."),
  httpMethod: external_exports.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  headers: external_exports.record(external_exports.string()).optional().describe("Header values can reference secrets using ${{secrets.KEY_NAME}} syntax."),
  body: external_exports.record(external_exports.unknown()).optional().describe("The JSON body to send with the request.")
});
var updateScheduleRequestSchema = external_exports.object({
  name: external_exports.string().min(3, "Schedule name must be at least 3 characters long").optional(),
  cronSchedule: cronScheduleSchema.optional(),
  functionUrl: external_exports.string().url("The function URL must be a valid URL.").optional(),
  httpMethod: external_exports.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional(),
  headers: external_exports.record(external_exports.string()).optional().describe("Header values can reference secrets using ${{secrets.KEY_NAME}} syntax."),
  body: external_exports.record(external_exports.unknown()).optional().describe("The JSON body to send with the request."),
  isActive: external_exports.boolean().optional().describe("Enable or disable the schedule.")
});
var listSchedulesResponseSchema = external_exports.array(scheduleSchema);
var executionLogResponseSchema = scheduleLogSchema;
var listExecutionLogsResponseSchema = external_exports.object({
  logs: external_exports.array(executionLogResponseSchema),
  totalCount: external_exports.number().int().nonnegative(),
  limit: external_exports.number().int().positive(),
  offset: external_exports.number().int().nonnegative()
});
var createScheduleResponseSchema = external_exports.object({
  id: external_exports.string().uuid(),
  cronJobId: external_exports.string(),
  message: external_exports.string()
});
var updateScheduleResponseSchema = external_exports.object({
  id: external_exports.string().uuid(),
  cronJobId: external_exports.string().optional(),
  message: external_exports.string()
});
var deleteScheduleResponseSchema = external_exports.object({
  message: external_exports.string()
});

// node_modules/@insforge/shared-schemas/dist/payments.schema.js
var paymentEnvironmentSchema = external_exports.enum(["test", "live"]);
var stripeEnvironmentSchema = paymentEnvironmentSchema;
var razorpayEnvironmentSchema = paymentEnvironmentSchema;
var stripeConnectionStatusSchema = external_exports.enum(["unconfigured", "connected", "error"]);
var stripeLatestSyncStatusSchema = external_exports.enum(["succeeded", "failed"]);
var stripeConnectionSchema = external_exports.object({
  environment: stripeEnvironmentSchema,
  status: stripeConnectionStatusSchema,
  accountId: external_exports.string().nullable(),
  accountEmail: external_exports.string().nullable(),
  accountLivemode: external_exports.boolean().nullable(),
  webhookEndpointId: external_exports.string().nullable(),
  webhookEndpointUrl: external_exports.string().nullable(),
  webhookConfiguredAt: external_exports.string().nullable(),
  maskedKey: external_exports.string().nullable(),
  lastSyncedAt: external_exports.string().nullable(),
  lastSyncStatus: stripeLatestSyncStatusSchema.nullable(),
  lastSyncError: external_exports.string().nullable(),
  lastSyncCounts: external_exports.record(external_exports.number())
});
var paymentProviderSchema = external_exports.enum(["stripe", "razorpay"]);
var stripeProductSchema = external_exports.object({
  environment: stripeEnvironmentSchema,
  productId: external_exports.string(),
  name: external_exports.string(),
  description: external_exports.string().nullable(),
  active: external_exports.boolean(),
  defaultPriceId: external_exports.string().nullable(),
  metadata: external_exports.record(external_exports.string()),
  syncedAt: external_exports.string()
});
var stripePriceSchema = external_exports.object({
  environment: stripeEnvironmentSchema,
  priceId: external_exports.string(),
  productId: external_exports.string().nullable(),
  active: external_exports.boolean(),
  currency: external_exports.string(),
  unitAmount: external_exports.number().nullable(),
  unitAmountDecimal: external_exports.string().nullable(),
  type: external_exports.string(),
  lookupKey: external_exports.string().nullable(),
  billingScheme: external_exports.string().nullable(),
  taxBehavior: external_exports.string().nullable(),
  recurringInterval: external_exports.string().nullable(),
  recurringIntervalCount: external_exports.number().nullable(),
  metadata: external_exports.record(external_exports.string()),
  syncedAt: external_exports.string()
});
var paymentCustomerSchema = external_exports.object({
  environment: paymentEnvironmentSchema,
  provider: paymentProviderSchema,
  providerCustomerId: external_exports.string(),
  email: external_exports.string().nullable(),
  name: external_exports.string().nullable(),
  phone: external_exports.string().nullable(),
  deleted: external_exports.boolean(),
  metadata: external_exports.record(external_exports.string()),
  providerCreatedAt: external_exports.string().nullable(),
  syncedAt: external_exports.string()
});
var paymentCustomerListItemSchema = paymentCustomerSchema.extend({
  paymentsCount: external_exports.number().int().nonnegative(),
  lastPaymentAt: external_exports.string().nullable(),
  totalSpend: external_exports.number().int().nonnegative().nullable(),
  totalSpendCurrency: external_exports.string().nullable(),
  paymentMethodBrand: external_exports.string().nullable(),
  paymentMethodLast4: external_exports.string().nullable(),
  countryCode: external_exports.string().trim().length(2).nullable()
});
var billingSubjectSchema = external_exports.object({
  type: external_exports.string().trim().min(1).max(100),
  id: external_exports.string().trim().min(1).max(255)
}).strict();
var checkoutModeSchema = external_exports.enum(["payment", "subscription"]);
var checkoutSessionStatusSchema = external_exports.enum([
  "initialized",
  "open",
  "completed",
  "expired",
  "failed"
]);
var checkoutSessionPaymentStatusSchema = external_exports.enum(["paid", "unpaid", "no_payment_required"]);
var checkoutSessionSchema = external_exports.object({
  id: external_exports.string(),
  environment: stripeEnvironmentSchema,
  mode: checkoutModeSchema,
  status: checkoutSessionStatusSchema,
  paymentStatus: checkoutSessionPaymentStatusSchema.nullable(),
  subjectType: external_exports.string().nullable(),
  subjectId: external_exports.string().nullable(),
  customerEmail: external_exports.string().nullable(),
  checkoutSessionId: external_exports.string().nullable(),
  customerId: external_exports.string().nullable(),
  paymentIntentId: external_exports.string().nullable(),
  subscriptionId: external_exports.string().nullable(),
  url: external_exports.string().nullable(),
  lastError: external_exports.string().nullable(),
  createdAt: external_exports.string(),
  updatedAt: external_exports.string()
});
var razorpayOrderStatusSchema = external_exports.enum([
  "initialized",
  "created",
  "attempted",
  "paid",
  "failed"
]);
var razorpayOrderSchema = external_exports.object({
  id: external_exports.string(),
  environment: razorpayEnvironmentSchema,
  status: razorpayOrderStatusSchema,
  subjectType: external_exports.string().nullable(),
  subjectId: external_exports.string().nullable(),
  customerName: external_exports.string().nullable(),
  customerEmail: external_exports.string().nullable(),
  customerContact: external_exports.string().nullable(),
  orderId: external_exports.string().nullable(),
  receipt: external_exports.string().nullable(),
  amount: external_exports.number(),
  amountPaid: external_exports.number().nullable(),
  amountDue: external_exports.number().nullable(),
  currency: external_exports.string(),
  attempts: external_exports.number().int().nonnegative().nullable(),
  verifiedPaymentId: external_exports.string().nullable(),
  verifiedAt: external_exports.string().nullable(),
  notes: external_exports.record(external_exports.string()),
  lastError: external_exports.string().nullable(),
  createdAt: external_exports.string(),
  updatedAt: external_exports.string()
});
var customerPortalSessionStatusSchema = external_exports.enum(["initialized", "created", "failed"]);
var customerPortalSessionSchema = external_exports.object({
  id: external_exports.string(),
  environment: stripeEnvironmentSchema,
  status: customerPortalSessionStatusSchema,
  subjectType: external_exports.string(),
  subjectId: external_exports.string(),
  customerId: external_exports.string().nullable(),
  returnUrl: external_exports.string().nullable(),
  configuration: external_exports.string().nullable(),
  url: external_exports.string().nullable(),
  lastError: external_exports.string().nullable(),
  createdAt: external_exports.string(),
  updatedAt: external_exports.string()
});
var paymentTransactionTypeSchema = external_exports.enum([
  "one_time_payment",
  "subscription_invoice",
  "refund",
  "failed_payment"
]);
var paymentTransactionStatusSchema = external_exports.enum([
  "succeeded",
  "failed",
  "pending",
  "refunded",
  "partially_refunded"
]);
var paymentTransactionSchema = external_exports.object({
  environment: paymentEnvironmentSchema,
  provider: paymentProviderSchema,
  type: paymentTransactionTypeSchema,
  status: paymentTransactionStatusSchema,
  subjectType: external_exports.string().nullable(),
  subjectId: external_exports.string().nullable(),
  providerCustomerId: external_exports.string().nullable(),
  customerEmailSnapshot: external_exports.string().nullable(),
  providerReferenceId: external_exports.string().nullable(),
  providerReferenceType: external_exports.string().nullable(),
  amount: external_exports.number().nullable(),
  amountRefunded: external_exports.number().nullable(),
  currency: external_exports.string().nullable(),
  description: external_exports.string().nullable(),
  paidAt: external_exports.string().nullable(),
  failedAt: external_exports.string().nullable(),
  refundedAt: external_exports.string().nullable(),
  providerCreatedAt: external_exports.string().nullable(),
  createdAt: external_exports.string(),
  updatedAt: external_exports.string()
});
var stripeSubscriptionStatusSchema = external_exports.enum([
  "incomplete",
  "incomplete_expired",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused"
]);
var stripeSubscriptionItemSchema = external_exports.object({
  environment: stripeEnvironmentSchema,
  subscriptionItemId: external_exports.string(),
  subscriptionId: external_exports.string(),
  productId: external_exports.string().nullable(),
  priceId: external_exports.string().nullable(),
  quantity: external_exports.number().nullable(),
  metadata: external_exports.record(external_exports.string()),
  createdAt: external_exports.string(),
  updatedAt: external_exports.string()
});
var stripeSubscriptionSchema = external_exports.object({
  environment: stripeEnvironmentSchema,
  subscriptionId: external_exports.string(),
  customerId: external_exports.string().nullable(),
  subjectType: external_exports.string().nullable(),
  subjectId: external_exports.string().nullable(),
  status: stripeSubscriptionStatusSchema,
  currentPeriodStart: external_exports.string().nullable(),
  currentPeriodEnd: external_exports.string().nullable(),
  cancelAtPeriodEnd: external_exports.boolean(),
  cancelAt: external_exports.string().nullable(),
  canceledAt: external_exports.string().nullable(),
  trialStart: external_exports.string().nullable(),
  trialEnd: external_exports.string().nullable(),
  latestInvoiceId: external_exports.string().nullable(),
  metadata: external_exports.record(external_exports.string()),
  syncedAt: external_exports.string(),
  createdAt: external_exports.string(),
  updatedAt: external_exports.string(),
  items: external_exports.array(stripeSubscriptionItemSchema)
});
var razorpaySubscriptionStatusSchema = external_exports.enum([
  "created",
  "authenticated",
  "active",
  "pending",
  "halted",
  "cancelled",
  "completed",
  "expired",
  "paused"
]);
var razorpaySubscriptionSchema = external_exports.object({
  environment: razorpayEnvironmentSchema,
  subscriptionId: external_exports.string(),
  planId: external_exports.string(),
  customerId: external_exports.string().nullable(),
  subjectType: external_exports.string().nullable(),
  subjectId: external_exports.string().nullable(),
  status: razorpaySubscriptionStatusSchema,
  currentStart: external_exports.string().nullable(),
  currentEnd: external_exports.string().nullable(),
  endedAt: external_exports.string().nullable(),
  quantity: external_exports.number().nullable(),
  chargeAt: external_exports.string().nullable(),
  startAt: external_exports.string().nullable(),
  endAt: external_exports.string().nullable(),
  totalCount: external_exports.number().nullable(),
  authAttempts: external_exports.number().nullable(),
  paidCount: external_exports.number().nullable(),
  remainingCount: external_exports.number().nullable(),
  shortUrl: external_exports.string().nullable(),
  hasScheduledChanges: external_exports.boolean(),
  changeScheduledAt: external_exports.string().nullable(),
  offerId: external_exports.string().nullable(),
  authorizationPaymentId: external_exports.string().nullable(),
  authorizationVerifiedAt: external_exports.string().nullable(),
  notes: external_exports.record(external_exports.string()),
  providerCreatedAt: external_exports.string().nullable(),
  syncedAt: external_exports.string(),
  createdAt: external_exports.string(),
  updatedAt: external_exports.string()
});
var stripeWebhookProcessingStatusSchema = external_exports.enum([
  "pending",
  "processed",
  "failed",
  "ignored"
]);
var stripeWebhookEventSchema = external_exports.object({
  environment: stripeEnvironmentSchema,
  eventId: external_exports.string(),
  eventType: external_exports.string(),
  livemode: external_exports.boolean(),
  accountId: external_exports.string().nullable(),
  objectType: external_exports.string().nullable(),
  objectId: external_exports.string().nullable(),
  processingStatus: stripeWebhookProcessingStatusSchema,
  attemptCount: external_exports.number(),
  lastError: external_exports.string().nullable(),
  receivedAt: external_exports.string(),
  processedAt: external_exports.string().nullable(),
  createdAt: external_exports.string(),
  updatedAt: external_exports.string()
});
var razorpayConnectionStatusSchema = external_exports.enum(["unconfigured", "connected", "error"]);
var razorpayLatestSyncStatusSchema = external_exports.enum(["succeeded", "failed"]);
var razorpayConnectionSchema = external_exports.object({
  environment: razorpayEnvironmentSchema,
  status: razorpayConnectionStatusSchema,
  accountId: external_exports.string().nullable(),
  merchantName: external_exports.string().nullable(),
  accountLivemode: external_exports.boolean().nullable(),
  webhookEndpointId: external_exports.string().nullable(),
  webhookEndpointUrl: external_exports.string().nullable(),
  webhookConfiguredAt: external_exports.string().nullable(),
  maskedKey: external_exports.string().nullable(),
  lastSyncedAt: external_exports.string().nullable(),
  lastSyncStatus: razorpayLatestSyncStatusSchema.nullable(),
  lastSyncError: external_exports.string().nullable(),
  lastSyncCounts: external_exports.record(external_exports.number())
});
var razorpayItemSchema = external_exports.object({
  environment: razorpayEnvironmentSchema,
  itemId: external_exports.string(),
  name: external_exports.string(),
  description: external_exports.string().nullable(),
  active: external_exports.boolean(),
  amount: external_exports.number().nullable(),
  unitAmount: external_exports.number().nullable().describe("Razorpay per-unit amount mirror; usually equals amount for catalog items."),
  currency: external_exports.string(),
  type: external_exports.string().nullable(),
  providerCreatedAt: external_exports.string().nullable(),
  syncedAt: external_exports.string()
});
var razorpayPlanSchema = external_exports.object({
  environment: razorpayEnvironmentSchema,
  planId: external_exports.string(),
  itemId: external_exports.string(),
  period: external_exports.string(),
  interval: external_exports.number(),
  amount: external_exports.number().nullable(),
  unitAmount: external_exports.number().nullable().describe("Razorpay nested item per-unit amount mirror; usually equals amount."),
  currency: external_exports.string(),
  active: external_exports.boolean(),
  notes: external_exports.record(external_exports.string()),
  providerCreatedAt: external_exports.string().nullable(),
  syncedAt: external_exports.string()
});

// node_modules/@insforge/shared-schemas/dist/payments-api.schema.js
var syncStripePaymentsRequestSchema = external_exports.object({
  environment: external_exports.union([stripeEnvironmentSchema, external_exports.literal("all")]).default("all")
});
var syncRazorpayPaymentsRequestSchema = external_exports.object({
  environment: external_exports.union([razorpayEnvironmentSchema, external_exports.literal("all")]).default("all")
});
var paymentEnvironmentParamsSchema = external_exports.object({
  environment: paymentEnvironmentSchema
}).strict();
var listStripeCatalogRequestSchema = external_exports.object({
  environment: stripeEnvironmentSchema.optional()
});
var paymentEnvironmentRequestSchema = external_exports.object({
  environment: paymentEnvironmentSchema
}).strict();
var listStripeCatalogQuerySchema = external_exports.object({}).strict();
var listStripeProductsQuerySchema = external_exports.object({}).strict();
var listStripePricesRequestSchema = external_exports.object({
  environment: stripeEnvironmentSchema,
  productId: external_exports.string().trim().min(1, "Stripe product id is required").optional()
}).strict();
var listStripePricesQuerySchema = external_exports.object({
  productId: external_exports.string().trim().min(1, "Stripe product id is required").optional()
}).strict();
var stripeProductParamsSchema = external_exports.object({
  productId: external_exports.string().trim().min(1, "Stripe product id is required")
});
var stripePriceParamsSchema = external_exports.object({
  priceId: external_exports.string().trim().min(1, "Stripe price id is required")
});
var stripeWebhookParamsSchema = external_exports.object({
  environment: stripeEnvironmentSchema
});
var razorpayEnvironmentParamsSchema = external_exports.object({
  environment: razorpayEnvironmentSchema
}).strict();
var razorpaySubscriptionParamsSchema = external_exports.object({
  environment: razorpayEnvironmentSchema,
  subscriptionId: external_exports.string().trim().min(1, "Razorpay subscription id is required")
}).strict();
var stripePriceRecurringIntervalSchema = external_exports.enum(["day", "week", "month", "year"]);
var stripePriceTaxBehaviorSchema = external_exports.enum(["exclusive", "inclusive", "unspecified"]);
var stripeIdempotencyKeySchema = external_exports.string().trim().min(1, "Idempotency key is required").max(200, "Idempotency key must be 200 characters or fewer");
function hasNoReservedInsForgeMetadata(metadata) {
  return !Object.keys(metadata ?? {}).some((key) => key.startsWith("insforge_"));
}
function hasNoReservedInsForgeNotes(notes) {
  return !Object.keys(notes ?? {}).some((key) => key.startsWith("insforge_"));
}
var currencySchema = external_exports.string().trim().length(3, "Currency must be a three-letter ISO currency code").transform((value2) => value2.toUpperCase());
var razorpayCheckoutPrefillSchema = external_exports.object({
  name: external_exports.string().trim().min(1).max(255).nullable().optional(),
  email: external_exports.string().trim().email().nullable().optional(),
  contact: external_exports.string().trim().min(1).max(32).nullable().optional()
}).strict();
var razorpayCheckoutOptionsSchema = external_exports.object({
  key: external_exports.string(),
  name: external_exports.string().nullable().optional(),
  description: external_exports.string().nullable().optional(),
  prefill: razorpayCheckoutPrefillSchema,
  callback_url: external_exports.string().nullable().optional()
}).strict();
var createStripeProductBodySchema = external_exports.object({
  name: external_exports.string().trim().min(1, "Product name is required"),
  description: external_exports.string().trim().max(5e3).nullable().optional(),
  active: external_exports.boolean().optional(),
  metadata: external_exports.record(external_exports.string()).optional(),
  idempotencyKey: stripeIdempotencyKeySchema.optional()
}).strict();
var createStripeProductRequestSchema = external_exports.object({
  environment: stripeEnvironmentSchema,
  ...createStripeProductBodySchema.shape
}).strict();
var updateStripeProductFields = {
  name: external_exports.string().trim().min(1, "Product name is required").optional(),
  description: external_exports.string().trim().max(5e3).nullable().optional(),
  active: external_exports.boolean().optional(),
  metadata: external_exports.record(external_exports.string()).optional()
};
function hasAtLeastOneValue(value2) {
  return Object.keys(value2).length > 0;
}
var updateStripeProductBodySchema = external_exports.object(updateStripeProductFields).strict().refine(hasAtLeastOneValue, {
  message: "At least one product field is required"
});
var updateStripeProductRequestSchema = external_exports.object({
  environment: stripeEnvironmentSchema,
  ...updateStripeProductFields
}).strict().refine(({ environment: _environment, ...value2 }) => hasAtLeastOneValue(value2), {
  message: "At least one product field is required"
});
var createStripePriceBodySchema = external_exports.object({
  productId: external_exports.string().trim().min(1, "Stripe product id is required"),
  currency: external_exports.string().trim().length(3, "Currency must be a three-letter ISO currency code").transform((value2) => value2.toLowerCase()),
  unitAmount: external_exports.number().int().nonnegative(),
  lookupKey: external_exports.string().trim().min(1).max(200).nullable().optional(),
  active: external_exports.boolean().optional(),
  recurring: external_exports.object({
    interval: stripePriceRecurringIntervalSchema,
    intervalCount: external_exports.number().int().positive().optional()
  }).strict().optional(),
  taxBehavior: stripePriceTaxBehaviorSchema.optional(),
  metadata: external_exports.record(external_exports.string()).optional(),
  idempotencyKey: stripeIdempotencyKeySchema.optional()
}).strict();
var createStripePriceRequestSchema = external_exports.object({
  environment: stripeEnvironmentSchema,
  ...createStripePriceBodySchema.shape
}).strict();
var updateStripePriceFields = {
  active: external_exports.boolean().optional(),
  lookupKey: external_exports.string().trim().min(1).max(200).nullable().optional(),
  taxBehavior: stripePriceTaxBehaviorSchema.optional(),
  metadata: external_exports.record(external_exports.string()).optional()
};
var updateStripePriceBodySchema = external_exports.object(updateStripePriceFields).strict().refine(hasAtLeastOneValue, {
  message: "At least one price field is required"
});
var updateStripePriceRequestSchema = external_exports.object({
  environment: stripeEnvironmentSchema,
  ...updateStripePriceFields
}).strict().refine(({ environment: _environment, ...value2 }) => hasAtLeastOneValue(value2), {
  message: "At least one price field is required"
});
var getStripeStatusResponseSchema = external_exports.object({
  connections: external_exports.array(stripeConnectionSchema)
});
var listStripeCatalogResponseSchema = external_exports.object({
  products: external_exports.array(stripeProductSchema),
  prices: external_exports.array(stripePriceSchema)
});
var listRazorpayCatalogResponseSchema = external_exports.object({
  items: external_exports.array(razorpayItemSchema),
  plans: external_exports.array(razorpayPlanSchema)
});
var listPaymentCustomersQuerySchema = external_exports.object({
  limit: external_exports.coerce.number().int().min(1).max(100).default(50)
}).strict();
var listPaymentCustomersRequestSchema = external_exports.object({
  environment: paymentEnvironmentSchema,
  ...listPaymentCustomersQuerySchema.shape
}).strict();
var listPaymentCustomersResponseSchema = external_exports.object({
  customers: external_exports.array(paymentCustomerListItemSchema)
});
var listStripeProductsResponseSchema = external_exports.object({
  products: external_exports.array(stripeProductSchema)
});
var listStripePricesResponseSchema = external_exports.object({
  prices: external_exports.array(stripePriceSchema)
});
var getStripeProductResponseSchema = external_exports.object({
  product: stripeProductSchema,
  prices: external_exports.array(stripePriceSchema)
});
var getStripePriceResponseSchema = external_exports.object({
  price: stripePriceSchema
});
var mutateStripeProductResponseSchema = external_exports.object({
  product: stripeProductSchema
});
var mutateStripePriceResponseSchema = external_exports.object({
  price: stripePriceSchema
});
var archiveStripePriceResponseSchema = external_exports.object({
  price: stripePriceSchema,
  archived: external_exports.boolean()
});
var deleteStripeProductResponseSchema = external_exports.object({
  productId: external_exports.string(),
  deleted: external_exports.boolean()
});
var razorpayItemParamsSchema = external_exports.object({
  itemId: external_exports.string().trim().min(1, "Razorpay item id is required")
});
var razorpayPlanPeriodSchema = external_exports.enum(["daily", "weekly", "monthly", "yearly"]);
var createRazorpayItemFields = {
  name: external_exports.string().trim().min(1, "Item name is required").max(255),
  description: external_exports.string().trim().max(2048).nullable().optional(),
  amount: external_exports.number().int().positive(),
  currency: currencySchema
};
var createRazorpayItemBodySchema = external_exports.object(createRazorpayItemFields).strict();
var createRazorpayItemRequestSchema = external_exports.object({
  environment: razorpayEnvironmentSchema,
  ...createRazorpayItemFields
}).strict();
var updateRazorpayItemFields = {
  name: external_exports.string().trim().min(1, "Item name is required").max(255).optional(),
  description: external_exports.string().trim().max(2048).nullable().optional(),
  amount: external_exports.number().int().positive().optional(),
  currency: currencySchema.optional(),
  active: external_exports.boolean().optional()
};
var updateRazorpayItemBodySchema = external_exports.object(updateRazorpayItemFields).strict().refine(hasAtLeastOneValue, {
  message: "At least one item field is required"
});
var updateRazorpayItemRequestSchema = external_exports.object({
  environment: razorpayEnvironmentSchema,
  ...updateRazorpayItemFields
}).strict().refine(({ environment: _environment, ...value2 }) => hasAtLeastOneValue(value2), {
  message: "At least one item field is required"
});
var createRazorpayPlanFields = {
  period: razorpayPlanPeriodSchema,
  interval: external_exports.number().int().positive(),
  item: external_exports.object({
    name: external_exports.string().trim().min(1, "Plan item name is required").max(255),
    description: external_exports.string().trim().max(2048).nullable().optional(),
    amount: external_exports.number().int().positive(),
    currency: currencySchema
  }).strict(),
  notes: external_exports.record(external_exports.string()).optional()
};
var createRazorpayPlanBodySchema = external_exports.object(createRazorpayPlanFields).strict().refine((value2) => hasNoReservedInsForgeNotes(value2.notes), {
  path: ["notes"],
  message: "Notes keys starting with insforge_ are reserved"
});
var createRazorpayPlanRequestSchema = external_exports.object({
  environment: razorpayEnvironmentSchema,
  ...createRazorpayPlanFields
}).strict().refine((value2) => hasNoReservedInsForgeNotes(value2.notes), {
  path: ["notes"],
  message: "Notes keys starting with insforge_ are reserved"
});
var mutateRazorpayItemResponseSchema = external_exports.object({
  item: razorpayItemSchema
});
var mutateRazorpayPlanResponseSchema = external_exports.object({
  plan: razorpayPlanSchema
});
var createCheckoutSessionLineItemSchema = external_exports.object({
  priceId: external_exports.string().trim().min(1, "Stripe price id is required"),
  quantity: external_exports.number().int().positive().max(999).default(1)
}).strict();
var createCheckoutSessionFields = {
  mode: checkoutModeSchema,
  lineItems: external_exports.array(createCheckoutSessionLineItemSchema).min(1).max(100),
  successUrl: external_exports.string().trim().url("Success URL must be a valid URL"),
  cancelUrl: external_exports.string().trim().url("Cancel URL must be a valid URL"),
  subject: billingSubjectSchema.optional(),
  customerEmail: external_exports.string().trim().email().nullable().optional(),
  metadata: external_exports.record(external_exports.string()).optional(),
  idempotencyKey: stripeIdempotencyKeySchema.optional()
};
var createCheckoutSessionBodySchema = external_exports.object(createCheckoutSessionFields).strict().refine((value2) => value2.mode !== "subscription" || value2.subject !== void 0, {
  path: ["subject"],
  message: "Subscription checkout requires a billing subject"
}).refine((value2) => hasNoReservedInsForgeMetadata(value2.metadata), {
  path: ["metadata"],
  message: "Metadata keys starting with insforge_ are reserved"
});
var createCheckoutSessionRequestSchema = external_exports.object({
  environment: stripeEnvironmentSchema,
  ...createCheckoutSessionFields
}).strict().refine((value2) => value2.mode !== "subscription" || value2.subject !== void 0, {
  path: ["subject"],
  message: "Subscription checkout requires a billing subject"
}).refine((value2) => hasNoReservedInsForgeMetadata(value2.metadata), {
  path: ["metadata"],
  message: "Metadata keys starting with insforge_ are reserved"
});
var createCheckoutSessionResponseSchema = external_exports.object({
  checkoutSession: checkoutSessionSchema
});
var createRazorpayOrderFields = {
  amount: external_exports.number().int().positive(),
  currency: currencySchema,
  receipt: external_exports.string().trim().min(1).max(40).nullable().optional(),
  description: external_exports.string().trim().max(2048).nullable().optional(),
  subject: billingSubjectSchema.optional(),
  customerName: external_exports.string().trim().min(1).max(255).nullable().optional(),
  customerEmail: external_exports.string().trim().email().nullable().optional(),
  customerContact: external_exports.string().trim().min(1).max(32).nullable().optional(),
  callbackUrl: external_exports.string().trim().url("Callback URL must be a valid URL").nullable().optional(),
  notes: external_exports.record(external_exports.string()).optional()
};
var createRazorpayOrderBodySchema = external_exports.object(createRazorpayOrderFields).strict().refine((value2) => hasNoReservedInsForgeNotes(value2.notes), {
  path: ["notes"],
  message: "Notes keys starting with insforge_ are reserved"
});
var createRazorpayOrderRequestSchema = external_exports.object({
  environment: razorpayEnvironmentSchema,
  ...createRazorpayOrderFields
}).strict().refine((value2) => hasNoReservedInsForgeNotes(value2.notes), {
  path: ["notes"],
  message: "Notes keys starting with insforge_ are reserved"
});
var createRazorpayOrderResponseSchema = external_exports.object({
  order: razorpayOrderSchema,
  checkoutOptions: razorpayCheckoutOptionsSchema.extend({
    amount: external_exports.number().int().positive(),
    currency: external_exports.string(),
    order_id: external_exports.string()
  })
});
var verifyRazorpayOrderFields = {
  orderId: external_exports.string().trim().min(1, "Razorpay order id is required"),
  paymentId: external_exports.string().trim().min(1, "Razorpay payment id is required"),
  signature: external_exports.string().trim().min(1, "Razorpay signature is required")
};
var verifyRazorpayOrderBodySchema = external_exports.object(verifyRazorpayOrderFields).strict();
var verifyRazorpayOrderRequestSchema = external_exports.object({
  environment: razorpayEnvironmentSchema,
  ...verifyRazorpayOrderFields
}).strict();
var verifyRazorpayOrderResponseSchema = external_exports.object({
  verified: external_exports.boolean(),
  order: razorpayOrderSchema
});
var createRazorpaySubscriptionFields = {
  planId: external_exports.string().trim().min(1, "Razorpay plan id is required"),
  totalCount: external_exports.number().int().positive().optional(),
  endAt: external_exports.number().int().positive().optional(),
  quantity: external_exports.number().int().positive().optional(),
  startAt: external_exports.number().int().positive().optional(),
  expireBy: external_exports.number().int().positive().optional(),
  customerNotify: external_exports.boolean().optional(),
  offerId: external_exports.string().trim().min(1).max(255).nullable().optional(),
  description: external_exports.string().trim().max(2048).nullable().optional(),
  subject: billingSubjectSchema,
  customerName: external_exports.string().trim().min(1).max(255).nullable().optional(),
  customerEmail: external_exports.string().trim().email().nullable().optional(),
  customerContact: external_exports.string().trim().min(1).max(32).nullable().optional(),
  callbackUrl: external_exports.string().trim().url("Callback URL must be a valid URL").nullable().optional(),
  notes: external_exports.record(external_exports.string()).optional()
};
function hasSubscriptionEnd(value2) {
  return value2.totalCount !== void 0 || value2.endAt !== void 0;
}
var createRazorpaySubscriptionBodySchema = external_exports.object(createRazorpaySubscriptionFields).strict().refine(hasSubscriptionEnd, {
  message: "Either totalCount or endAt is required"
}).refine((value2) => hasNoReservedInsForgeNotes(value2.notes), {
  path: ["notes"],
  message: "Notes keys starting with insforge_ are reserved"
});
var createRazorpaySubscriptionRequestSchema = external_exports.object({
  environment: razorpayEnvironmentSchema,
  ...createRazorpaySubscriptionFields
}).strict().refine(hasSubscriptionEnd, {
  message: "Either totalCount or endAt is required"
}).refine((value2) => hasNoReservedInsForgeNotes(value2.notes), {
  path: ["notes"],
  message: "Notes keys starting with insforge_ are reserved"
});
var createRazorpaySubscriptionResponseSchema = external_exports.object({
  subscription: razorpaySubscriptionSchema,
  checkoutOptions: razorpayCheckoutOptionsSchema.extend({
    subscription_id: external_exports.string()
  })
});
var verifyRazorpaySubscriptionFields = {
  subscriptionId: external_exports.string().trim().min(1, "Razorpay subscription id is required"),
  paymentId: external_exports.string().trim().min(1, "Razorpay payment id is required"),
  signature: external_exports.string().trim().min(1, "Razorpay signature is required")
};
var verifyRazorpaySubscriptionBodySchema = external_exports.object(verifyRazorpaySubscriptionFields).strict();
var verifyRazorpaySubscriptionRequestSchema = external_exports.object({
  environment: razorpayEnvironmentSchema,
  ...verifyRazorpaySubscriptionFields
}).strict();
var verifyRazorpaySubscriptionResponseSchema = external_exports.object({
  verified: external_exports.boolean(),
  subscription: razorpaySubscriptionSchema
});
var cancelRazorpaySubscriptionBodySchema = external_exports.object({
  cancelAtCycleEnd: external_exports.boolean().default(false)
}).strict();
var cancelRazorpaySubscriptionRequestSchema = external_exports.object({
  environment: razorpayEnvironmentSchema,
  subscriptionId: external_exports.string().trim().min(1, "Razorpay subscription id is required"),
  ...cancelRazorpaySubscriptionBodySchema.shape
}).strict();
var cancelRazorpaySubscriptionResponseSchema = external_exports.object({
  subscription: razorpaySubscriptionSchema
});
var pauseRazorpaySubscriptionBodySchema = external_exports.object({}).strict();
var pauseRazorpaySubscriptionResponseSchema = external_exports.object({
  subscription: razorpaySubscriptionSchema
});
var resumeRazorpaySubscriptionBodySchema = external_exports.object({}).strict();
var resumeRazorpaySubscriptionResponseSchema = external_exports.object({
  subscription: razorpaySubscriptionSchema
});
var createCustomerPortalSessionBodySchema = external_exports.object({
  subject: billingSubjectSchema,
  returnUrl: external_exports.string().trim().url("Return URL must be a valid URL").optional(),
  configuration: external_exports.string().trim().min(1).max(255).optional()
}).strict();
var createCustomerPortalSessionRequestSchema = external_exports.object({
  environment: stripeEnvironmentSchema,
  ...createCustomerPortalSessionBodySchema.shape
}).strict();
var createCustomerPortalSessionResponseSchema = external_exports.object({
  customerPortalSession: customerPortalSessionSchema
});
var subjectFilterFields = {
  subjectType: external_exports.string().trim().min(1).max(100).optional(),
  subjectId: external_exports.string().trim().min(1).max(255).optional()
};
function hasCompleteSubjectFilter(value2) {
  return value2.subjectType === void 0 === (value2.subjectId === void 0);
}
var listPaymentTransactionsRequestSchema = external_exports.object({
  ...subjectFilterFields,
  environment: paymentEnvironmentSchema,
  limit: external_exports.coerce.number().int().min(1).max(100).default(50)
}).strict().refine(hasCompleteSubjectFilter, {
  message: "subjectType and subjectId must be provided together"
});
var listPaymentTransactionsQuerySchema = external_exports.object({
  ...subjectFilterFields,
  limit: external_exports.coerce.number().int().min(1).max(100).default(50)
}).strict().refine(hasCompleteSubjectFilter, {
  message: "subjectType and subjectId must be provided together"
});
var listStripeSubscriptionsRequestSchema = external_exports.object({
  ...subjectFilterFields,
  environment: stripeEnvironmentSchema,
  limit: external_exports.coerce.number().int().min(1).max(100).default(50)
}).strict().refine(hasCompleteSubjectFilter, {
  message: "subjectType and subjectId must be provided together"
});
var listStripeSubscriptionsQuerySchema = external_exports.object({
  ...subjectFilterFields,
  limit: external_exports.coerce.number().int().min(1).max(100).default(50)
}).strict().refine(hasCompleteSubjectFilter, {
  message: "subjectType and subjectId must be provided together"
});
var listRazorpaySubscriptionsRequestSchema = external_exports.object({
  ...subjectFilterFields,
  environment: razorpayEnvironmentSchema,
  limit: external_exports.coerce.number().int().min(1).max(100).default(50)
}).strict().refine(hasCompleteSubjectFilter, {
  message: "subjectType and subjectId must be provided together"
});
var listRazorpaySubscriptionsQuerySchema = external_exports.object({
  ...subjectFilterFields,
  limit: external_exports.coerce.number().int().min(1).max(100).default(50)
}).strict().refine(hasCompleteSubjectFilter, {
  message: "subjectType and subjectId must be provided together"
});
var listPaymentTransactionsResponseSchema = external_exports.object({
  transactions: external_exports.array(paymentTransactionSchema)
});
var listStripeSubscriptionsResponseSchema = external_exports.object({
  subscriptions: external_exports.array(stripeSubscriptionSchema)
});
var listRazorpaySubscriptionsResponseSchema = external_exports.object({
  subscriptions: external_exports.array(razorpaySubscriptionSchema)
});
var syncStripePaymentsSubscriptionsSummarySchema = external_exports.object({
  environment: stripeEnvironmentSchema,
  synced: external_exports.number().int().nonnegative(),
  unmapped: external_exports.number().int().nonnegative(),
  deleted: external_exports.number().int().nonnegative()
});
var syncStripePaymentsEnvironmentResultSchema = external_exports.object({
  environment: stripeEnvironmentSchema,
  connection: stripeConnectionSchema,
  subscriptions: syncStripePaymentsSubscriptionsSummarySchema.nullable()
});
var syncStripePaymentsResponseSchema = external_exports.object({
  results: external_exports.array(syncStripePaymentsEnvironmentResultSchema)
});
var configureStripeWebhookResponseSchema = external_exports.object({
  connection: stripeConnectionSchema
});
var stripeWebhookResponseSchema = external_exports.object({
  received: external_exports.boolean(),
  handled: external_exports.boolean(),
  event: stripeWebhookEventSchema.optional()
});
var stripeKeyConfigSchema = external_exports.object({
  environment: stripeEnvironmentSchema,
  value: external_exports.string().nullable()
});
var razorpayKeyConfigSchema = external_exports.object({
  environment: razorpayEnvironmentSchema,
  keyType: external_exports.enum(["api_key", "api_secret", "webhook_secret"]),
  value: external_exports.string().nullable()
});
var getStripeConfigResponseSchema = external_exports.object({
  keys: external_exports.array(stripeKeyConfigSchema)
});
var getRazorpayStatusResponseSchema = external_exports.object({
  razorpayConnections: external_exports.array(razorpayConnectionSchema)
});
var getRazorpayConfigResponseSchema = external_exports.object({
  keys: external_exports.array(razorpayKeyConfigSchema)
});
var razorpaySyncCountsSchema = external_exports.object({
  plans: external_exports.number().int().nonnegative(),
  items: external_exports.number().int().nonnegative(),
  customers: external_exports.number().int().nonnegative(),
  subscriptions: external_exports.number().int().nonnegative(),
  invoices: external_exports.number().int().nonnegative(),
  payments: external_exports.number().int().nonnegative()
}).strict();
var syncRazorpayPaymentsEnvironmentResultSchema = external_exports.object({
  environment: razorpayEnvironmentSchema,
  status: external_exports.enum(["succeeded", "failed"]),
  connection: razorpayConnectionSchema,
  syncCounts: razorpaySyncCountsSchema,
  error: external_exports.string().nullable()
}).strict();
var syncRazorpayPaymentsResponseSchema = external_exports.object({
  results: external_exports.array(syncRazorpayPaymentsEnvironmentResultSchema)
});
var upsertStripeConfigBodySchema = external_exports.object({
  secretKey: external_exports.string().trim().min(1, "Stripe secret key is required")
}).strict();
var upsertStripeConfigRequestSchema = external_exports.object({
  environment: stripeEnvironmentSchema,
  ...upsertStripeConfigBodySchema.shape
}).strict();
var upsertRazorpayConfigBodySchema = external_exports.object({
  keyId: external_exports.string().trim().min(1, "Razorpay key ID is required"),
  keySecret: external_exports.string().trim().min(1, "Razorpay key secret is required"),
  webhookSecret: external_exports.string().trim().optional()
}).strict();
var upsertRazorpayConfigRequestSchema = external_exports.object({
  environment: razorpayEnvironmentSchema,
  ...upsertRazorpayConfigBodySchema.shape
}).strict();
var getRazorpayWebhookSetupResponseSchema = external_exports.object({
  connection: razorpayConnectionSchema,
  webhookUrl: external_exports.string().trim().min(1),
  webhookSecret: external_exports.string().trim().min(1)
});
var razorpayWebhookResponseSchema = external_exports.object({
  received: external_exports.boolean(),
  handled: external_exports.boolean()
});

// node_modules/@insforge/shared-schemas/dist/compute-services.schema.js
var serviceStatusEnum = external_exports.enum([
  "creating",
  "deploying",
  "running",
  "stopped",
  "failed",
  "destroying"
]);
var cpuTierRegex = /^(shared|performance)-[1-9]\d*x$/;
var cpuTierEnum = external_exports.string().regex(cpuTierRegex, "cpu must match `<shared|performance>-<N>x`, e.g. shared-2x or performance-8x");
var serviceSchema = external_exports.object({
  id: external_exports.string().uuid(),
  projectId: external_exports.string(),
  name: external_exports.string(),
  imageUrl: external_exports.string(),
  port: external_exports.number(),
  cpu: cpuTierEnum,
  memory: external_exports.number(),
  region: external_exports.string(),
  // Required on the response shape (every persisted row has a value — the
  // migration backfills `'http'` for pre-INS-271 rows). Defaults are only
  // optional on the *input* schemas.
  protocol: external_exports.enum(["http", "tcp"]),
  // Required on the response shape (the migration backfills `true` for
  // pre-existing rows). true = Fly stops the machine when idle and
  // cold-starts it on the next request (the default); false = always-on.
  scaleToZero: external_exports.boolean(),
  flyAppId: external_exports.string().nullable(),
  flyMachineId: external_exports.string().nullable(),
  status: serviceStatusEnum,
  endpointUrl: external_exports.string().nullable(),
  createdAt: external_exports.string(),
  updatedAt: external_exports.string()
});

// node_modules/@insforge/shared-schemas/dist/compute-services-api.schema.js
var envVarKeyRegex = /^[A-Z_][A-Z0-9_]*$/;
var createServiceSchema = external_exports.object({
  name: external_exports.string().min(1).max(63).regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
    message: "Name must be DNS-safe: lowercase letters, numbers, and dashes only, must start with a letter or number"
  }),
  /**
   * Image URL — image-mode (any registry) or source-mode (digest-pinned
   * registry.fly.io ref produced by the CLI's `flyctl deploy --build-only --push`).
   * The CLI is responsible for building/pushing in source mode; the cloud
   * just launches a machine pointing at the resulting image.
   *
   * Required for createService (image-mode immediate launch).
   * Omit for prepareForDeploy / source-mode (the route's own validation handles it).
   */
  imageUrl: external_exports.string().min(1).optional(),
  port: external_exports.number().min(1).max(65535),
  cpu: cpuTierEnum.default("shared-1x"),
  memory: external_exports.coerce.number().refine((v) => [256, 512, 1024, 2048, 4096, 8192].includes(v), {
    message: "Memory must be one of: 256, 512, 1024, 2048, 4096, 8192"
  }).default(512),
  envVars: external_exports.record(external_exports.string().regex(envVarKeyRegex, { message: "Env var keys must match [A-Z_][A-Z0-9_]*" }), external_exports.string().max(4096)).optional(),
  region: external_exports.string().default("iad"),
  /**
   * Edge protocol. `'http'` (default) is the existing behaviour — Fly terminates
   * TLS at its anycast edge and proxies HTTP/1.1 + HTTP/2 to the container on
   * the container's port. `'tcp'` is for raw TCP services (Redis, the Postgres
   * wire protocol, custom binary protocols) — Fly exposes the container's port
   * directly with empty L7 handlers so bytes flow end-to-end without HTTP
   * inspection. Optional and back-compat: omitting the field is identical to
   * sending `'http'` at every fallback site downstream.
   */
  protocol: external_exports.enum(["http", "tcp"]).optional(),
  /**
   * Scale-to-zero. `true` (default) is the existing behaviour — Fly stops the
   * machine when idle and cold-starts it on the next request. `false` keeps
   * the machine running 24/7 (Fly autostop 'off', one machine always warm)
   * for services that can't tolerate cold-start latency. Optional and
   * back-compat: omitting the field is identical to sending `true`.
   */
  scaleToZero: external_exports.boolean().optional()
});
var updateServiceSchema = external_exports.object({
  /**
   * New image URL — image-mode (any registry) or source-mode digest-pinned
   * registry.fly.io ref. For non-image updates (port-only, env-only) omit.
   */
  imageUrl: external_exports.string().min(1).optional(),
  port: external_exports.number().min(1).max(65535).optional(),
  cpu: cpuTierEnum.optional(),
  memory: external_exports.coerce.number().refine((v) => [256, 512, 1024, 2048, 4096, 8192].includes(v), {
    message: "Memory must be one of: 256, 512, 1024, 2048, 4096, 8192"
  }).optional(),
  /**
   * Wholesale replacement of the env var map. Sending {} clears all env
   * vars. For partial edits (rotate one secret without restating the
   * other six), use envVarsPatch instead.
   */
  envVars: external_exports.record(external_exports.string().regex(envVarKeyRegex, { message: "Env var keys must match [A-Z_][A-Z0-9_]*" }), external_exports.string().max(4096)).optional(),
  /**
   * Partial env edit. `set` upserts keys, `unset` removes them. The server
   * decrypts the existing env_vars blob, applies the patch, and re-encrypts.
   * Mutually exclusive with `envVars` (the wholesale path) — sending both
   * is rejected, since the intent would be ambiguous.
   */
  envVarsPatch: external_exports.object({
    set: external_exports.record(external_exports.string().regex(envVarKeyRegex, {
      message: "Env var keys must match [A-Z_][A-Z0-9_]*"
    }), external_exports.string().max(4096)).optional(),
    unset: external_exports.array(external_exports.string().regex(envVarKeyRegex, {
      message: "Env var keys must match [A-Z_][A-Z0-9_]*"
    })).optional()
  }).refine((p) => p.set && Object.keys(p.set).length > 0 || p.unset && p.unset.length > 0, {
    message: "envVarsPatch must specify at least one key in set or unset"
  }).optional(),
  region: external_exports.string().optional(),
  /**
   * Edge protocol — same semantics as createServiceSchema.protocol. Optional
   * on update; omitting it leaves the existing service's protocol in place.
   */
  protocol: external_exports.enum(["http", "tcp"]).optional(),
  /**
   * Scale-to-zero — same semantics as createServiceSchema.scaleToZero.
   * Optional on update; omitting it leaves the existing setting in place.
   */
  scaleToZero: external_exports.boolean().optional()
}).refine((data) => !(data.envVars !== void 0 && data.envVarsPatch !== void 0), {
  message: "envVars and envVarsPatch are mutually exclusive \u2014 pick one (envVars replaces wholesale, envVarsPatch merges)",
  path: ["envVarsPatch"]
});
var listServicesResponseSchema = external_exports.object({
  services: external_exports.array(serviceSchema)
});
var computeLogLineSchema = external_exports.object({
  timestamp: external_exports.number(),
  message: external_exports.string(),
  instance: external_exports.string().optional(),
  region: external_exports.string().optional()
});
var computeLogsResponseSchema = external_exports.object({
  lines: external_exports.array(computeLogLineSchema),
  nextToken: external_exports.string().nullable()
});

// node_modules/@insforge/shared-schemas/dist/posthog.schema.js
var posthogConnectionStatusSchema = external_exports.enum(["active", "degraded", "revoked"]);
var posthogConnectionSchema = external_exports.object({
  posthogProjectId: external_exports.string(),
  organizationName: external_exports.string().nullable(),
  projectName: external_exports.string(),
  region: external_exports.enum(["US", "EU"]),
  host: external_exports.string().url(),
  apiKey: external_exports.string(),
  status: posthogConnectionStatusSchema,
  createdAt: external_exports.string()
});
var posthogDashboardSchema = external_exports.object({
  id: external_exports.number(),
  name: external_exports.string(),
  description: external_exports.string().optional(),
  pinned: external_exports.boolean().optional(),
  lastModifiedAt: external_exports.string().optional(),
  url: external_exports.string().url()
});
var posthogDashboardsResponseSchema = external_exports.object({
  dashboards: external_exports.array(posthogDashboardSchema),
  count: external_exports.number()
});
var posthogSummarySchema = external_exports.object({
  todayEvents: external_exports.number(),
  dau24h: external_exports.number(),
  totalEvents7d: external_exports.number(),
  topEvents: external_exports.array(external_exports.object({ event: external_exports.string(), count: external_exports.number() }))
});
var posthogEventRecordSchema = external_exports.object({
  id: external_exports.string(),
  event: external_exports.string(),
  distinctId: external_exports.string(),
  timestamp: external_exports.string()
});
var posthogEventsResponseSchema = external_exports.object({
  events: external_exports.array(posthogEventRecordSchema),
  next: external_exports.string().nullable()
});
var posthogTimeframeSchema = external_exports.enum(["24h", "7d", "30d", "3m"]);
var posthogBreakdownSchema = external_exports.enum(["Page", "Country", "DeviceType"]);
var posthogMetricSchema = external_exports.enum(["visitors", "views", "bounce_rate"]);
var posthogWebOverviewItemSchema = external_exports.object({
  key: external_exports.string(),
  value: external_exports.number().nullable(),
  previous: external_exports.number().nullable(),
  changeFromPreviousPct: external_exports.number().nullable(),
  isIncreaseBad: external_exports.boolean().nullable().optional()
});
var posthogWebOverviewResponseSchema = external_exports.object({
  items: external_exports.array(posthogWebOverviewItemSchema)
});
var posthogWebStatsRowSchema = external_exports.object({
  breakdownValue: external_exports.string().nullable(),
  visitors: external_exports.number(),
  views: external_exports.number(),
  uiFillFraction: external_exports.number()
});
var posthogWebStatsResponseSchema = external_exports.object({
  rows: external_exports.array(posthogWebStatsRowSchema)
});
var posthogTrendPointSchema = external_exports.object({
  date: external_exports.string(),
  count: external_exports.number()
});
var posthogTrendsResponseSchema = external_exports.object({
  series: external_exports.array(posthogTrendPointSchema)
});
var posthogRetentionRowSchema = external_exports.object({
  date: external_exports.string(),
  label: external_exports.string(),
  values: external_exports.array(external_exports.object({ count: external_exports.number().nullable() }))
});
var posthogRetentionResponseSchema = external_exports.object({
  rows: external_exports.array(posthogRetentionRowSchema)
});
var posthogRecordingItemSchema = external_exports.object({
  id: external_exports.string(),
  distinctId: external_exports.string(),
  durationSeconds: external_exports.number(),
  startTime: external_exports.string(),
  endTime: external_exports.string(),
  startUrl: external_exports.string().nullable(),
  clickCount: external_exports.number(),
  consoleErrorCount: external_exports.number()
});
var posthogRecordingsResponseSchema = external_exports.object({
  items: external_exports.array(posthogRecordingItemSchema)
});
var posthogUrlPattern = /^https:\/\/([a-z0-9-]+\.)*posthog\.com(?::\d+)?(\/|$)/i;
var posthogShareTokenResponseSchema = external_exports.object({
  embedUrl: external_exports.string().url().refine((u) => posthogUrlPattern.test(u), {
    message: "embedUrl must be an https://*.posthog.com URL"
  })
});

// node_modules/@insforge/shared-schemas/dist/posthog-api.schema.js
var createPosthogConnectionRequestSchema = external_exports.object({
  apiKey: external_exports.string().min(1, "API key is required"),
  region: external_exports.enum(["US", "EU"]),
  host: external_exports.string().url().optional()
});
var createPosthogConnectionResponseSchema = posthogConnectionSchema.extend({
  message: external_exports.string()
});
var updatePosthogConnectionStatusRequestSchema = external_exports.object({
  status: posthogConnectionStatusSchema
});
var deletePosthogConnectionResponseSchema = external_exports.object({
  message: external_exports.string()
});

// node_modules/@insforge/shared-schemas/dist/memory-api.schema.js
var memoryKindSchema = external_exports.enum(["fact", "decision", "preference", "reference"]);
var rememberRequestSchema = external_exports.object({
  scope: external_exports.string().min(1).default("default"),
  source: external_exports.string().optional(),
  // explicit single-memory form
  kind: memoryKindSchema.optional(),
  title: external_exports.string().min(1).max(2e3).optional(),
  content: external_exports.string().min(1).max(2e4).optional(),
  // transcript form — capped to bound extraction LLM cost on huge inputs
  transcript: external_exports.string().min(1).max(5e4).optional()
}).refine((v) => Boolean(v.transcript) || Boolean(v.title && v.content), {
  message: "Provide either { transcript } or { title, content }"
});
var reconcileActionSchema = external_exports.enum(["ADD", "UPDATE", "NOOP"]);
var rememberResultSchema = external_exports.object({
  action: reconcileActionSchema,
  id: external_exports.string().uuid().optional(),
  title: external_exports.string()
});
var rememberResponseSchema = external_exports.object({
  results: external_exports.array(rememberResultSchema)
});
var recallRequestSchema = external_exports.object({
  scope: external_exports.string().min(1).default("default"),
  // capped — the query is embedded, so an unbounded string burns embedding tokens
  query: external_exports.string().min(1).max(4e3),
  limit: external_exports.number().int().positive().max(50).default(5),
  threshold: external_exports.number().min(0).max(1).optional()
});
var recalledMemorySchema = external_exports.object({
  id: external_exports.string().uuid(),
  kind: memoryKindSchema,
  title: external_exports.string(),
  content: external_exports.string(),
  similarity: external_exports.number(),
  updated_at: external_exports.string()
});
var recallResponseSchema = external_exports.object({
  memories: external_exports.array(recalledMemorySchema)
});
var memoryIndexRequestSchema = external_exports.object({
  scope: external_exports.string().min(1).default("default")
});
var memoryIndexEntrySchema = external_exports.object({
  id: external_exports.string().uuid(),
  kind: memoryKindSchema,
  title: external_exports.string(),
  updated_at: external_exports.string()
});
var memoryIndexResponseSchema = external_exports.object({
  entries: external_exports.array(memoryIndexEntrySchema)
});

// node_modules/@insforge/shared-schemas/dist/error-codes.schema.js
var authErrorCodes = [
  "AUTH_INVALID_EMAIL",
  "AUTH_WEAK_PASSWORD",
  "AUTH_INVALID_CREDENTIALS",
  "AUTH_INVALID_API_KEY",
  "AUTH_EMAIL_EXISTS",
  "AUTH_USER_NOT_FOUND",
  "AUTH_OAUTH_CONFIG_ALREADY_EXISTS",
  "AUTH_OAUTH_CONFIG_ERROR",
  "AUTH_OAUTH_CONFIG_NOT_FOUND",
  "AUTH_UNSUPPORTED_PROVIDER",
  "AUTH_TOKEN_EXPIRED",
  "AUTH_UNAUTHORIZED",
  "AUTH_NEED_VERIFICATION",
  "AUTH_SIGNUP_DISABLED",
  "AUTH_VERIFICATION_EMAIL_DELIVERY_FAILED"
];
var databaseErrorCodes = [
  "DATABASE_INVALID_PARAMETER",
  "DATABASE_VALIDATION_ERROR",
  "DATABASE_CONSTRAINT_VIOLATION",
  "DATABASE_NOT_FOUND",
  "DATABASE_DUPLICATE",
  "DATABASE_MIGRATION_ALREADY_EXISTS",
  "DATABASE_PERMISSION_DENIED",
  "DATABASE_INTERNAL_ERROR",
  "DATABASE_FORBIDDEN"
];
var storageErrorCodes = [
  "STORAGE_ALREADY_EXISTS",
  "STORAGE_INVALID_PARAMETER",
  "STORAGE_INVALID_FILE_TYPE",
  "STORAGE_INSUFFICIENT_QUOTA",
  "STORAGE_NOT_FOUND",
  "STORAGE_PERMISSION_DENIED",
  "S3_ACCESS_KEY_LIMIT_EXCEEDED",
  "S3_ACCESS_KEY_NOT_FOUND",
  "S3_PROTOCOL_UNAVAILABLE"
];
var realtimeErrorCodes = [
  "REALTIME_CHANNEL_NOT_FOUND",
  "REALTIME_CONNECTION_FAILED",
  "REALTIME_INVALID_CHANNEL_REQUEST",
  "REALTIME_INVALID_CHANNEL_PATTERN",
  "REALTIME_INVALID_EVENT",
  "REALTIME_NOT_SUBSCRIBED",
  "REALTIME_UNAUTHORIZED"
];
var aiErrorCodes = ["AI_INVALID_API_KEY", "AI_INVALID_MODEL", "AI_UPSTREAM_UNAVAILABLE"];
var analyticsErrorCodes = ["ANALYTICS_NOT_CONNECTED", "ANALYTICS_UNAVAILABLE"];
var logsErrorCodes = ["LOGS_AWS_NOT_CONFIGURED", "LOG_NOT_FOUND"];
var computeErrorCodes = [
  "COMPUTE_CLOUD_UNAVAILABLE",
  "COMPUTE_NOT_CONFIGURED",
  "COMPUTE_PROVIDER_ERROR",
  "COMPUTE_SERVICE_NOT_FOUND",
  "COMPUTE_MACHINE_NOT_FOUND",
  "COMPUTE_SERVICE_NOT_CONFIGURED",
  "COMPUTE_SERVICE_DEPLOY_FAILED",
  "COMPUTE_SERVICE_ALREADY_EXISTS",
  "COMPUTE_SERVICE_START_FAILED",
  "COMPUTE_SERVICE_STOP_FAILED",
  "COMPUTE_SERVICE_DELETE_FAILED",
  "COMPUTE_REGION_CHANGE_NOT_SUPPORTED",
  "COMPUTE_QUOTA_EXCEEDED"
];
var billingErrorCodes = ["BILLING_INSUFFICIENT_BALANCE"];
var emailErrorCodes = [
  "EMAIL_PROVIDER_NOT_CONFIGURED",
  "EMAIL_SMTP_CONNECTION_FAILED",
  "EMAIL_SMTP_SEND_FAILED",
  "EMAIL_TEMPLATE_NOT_FOUND"
];
var deploymentErrorCodes = [
  "DEPLOYMENT_ALREADY_EXISTS",
  "DEPLOYMENT_INVALID_FILE",
  "DEPLOYMENT_NOT_FOUND",
  "DEPLOYMENT_UPLOAD_CANCELED",
  "DOMAIN_ALREADY_EXISTS",
  "DOMAIN_INVALID",
  "DOMAIN_NOT_FOUND",
  "ENVIRONMENT_VARIABLE_NOT_FOUND"
];
var docsErrorCodes = ["DOCS_NOT_FOUND"];
var functionErrorCodes = [
  "FUNCTION_ALREADY_EXISTS",
  "FUNCTION_DEPLOYMENT_NOT_FOUND",
  "FUNCTION_NOT_FOUND"
];
var scheduleErrorCodes = ["SCHEDULE_INVALID_CRON", "SCHEDULE_NOT_FOUND"];
var paymentErrorCodes = [
  "PAYMENT_CHECKOUT_ALREADY_EXISTS",
  "PAYMENT_CONFIG_INVALID",
  "PAYMENT_CONFIG_NOT_FOUND",
  "PAYMENT_NOT_FOUND",
  "PAYMENT_METHOD_DECLINED",
  "PAYMENT_PRICE_NOT_FOUND",
  "PAYMENT_PRODUCT_NOT_FOUND"
];
var secretErrorCodes = ["SECRET_ALREADY_EXISTS", "SECRET_NOT_FOUND"];
var generalErrorCodes = [
  "MISSING_FIELD",
  "ALREADY_EXISTS",
  "INVALID_INPUT",
  "NOT_FOUND",
  "UNKNOWN_ERROR",
  "INTERNAL_ERROR",
  "TOO_MANY_REQUESTS",
  "FORBIDDEN",
  "RATE_LIMITED",
  "NOT_IMPLEMENTED",
  "UPSTREAM_FAILURE"
];
var errorCodeValues = [
  ...authErrorCodes,
  ...databaseErrorCodes,
  ...storageErrorCodes,
  ...realtimeErrorCodes,
  ...aiErrorCodes,
  ...analyticsErrorCodes,
  ...logsErrorCodes,
  ...computeErrorCodes,
  ...billingErrorCodes,
  ...emailErrorCodes,
  ...deploymentErrorCodes,
  ...docsErrorCodes,
  ...functionErrorCodes,
  ...scheduleErrorCodes,
  ...paymentErrorCodes,
  ...secretErrorCodes,
  ...generalErrorCodes
];
var errorCodeSchema = external_exports.enum(errorCodeValues);
var ERROR_CODES = errorCodeSchema.enum;

// node_modules/@supabase/postgrest-js/dist/esm/wrapper.mjs
var import_cjs = __toESM(require_cjs(), 1);
var {
  PostgrestClient,
  PostgrestQueryBuilder,
  PostgrestFilterBuilder,
  PostgrestTransformBuilder,
  PostgrestBuilder,
  PostgrestError
} = import_cjs.default;

// node_modules/@insforge/sdk/dist/index.mjs
var InsForgeError = class _InsForgeError extends Error {
  constructor(message, statusCode, error, nextActions) {
    super(message);
    this.name = "InsForgeError";
    this.statusCode = statusCode;
    this.error = error;
    this.nextActions = nextActions;
  }
  static fromApiError(apiError) {
    return new _InsForgeError(
      apiError.message,
      apiError.statusCode,
      apiError.error,
      apiError.nextActions
    );
  }
};
var SENSITIVE_HEADERS = ["authorization", "x-api-key", "cookie", "set-cookie"];
var SENSITIVE_BODY_KEYS = [
  "password",
  "token",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "secret",
  "apikey",
  "api_key",
  "email",
  "ssn",
  "creditcard",
  "credit_card"
];
function redactHeaders(headers) {
  const redacted = {};
  for (const [key, value2] of Object.entries(headers)) {
    if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
      redacted[key] = "***REDACTED***";
    } else {
      redacted[key] = value2;
    }
  }
  return redacted;
}
function sanitizeBody(body) {
  if (body === null || body === void 0) {
    return body;
  }
  if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body);
      return sanitizeBody(parsed);
    } catch {
      return body;
    }
  }
  if (Array.isArray(body)) {
    return body.map(sanitizeBody);
  }
  if (typeof body === "object") {
    const sanitized = {};
    for (const [key, value2] of Object.entries(body)) {
      if (SENSITIVE_BODY_KEYS.includes(key.toLowerCase().replace(/[-_]/g, ""))) {
        sanitized[key] = "***REDACTED***";
      } else {
        sanitized[key] = sanitizeBody(value2);
      }
    }
    return sanitized;
  }
  return body;
}
function formatBody(body) {
  if (body === void 0 || body === null) {
    return "";
  }
  if (typeof body === "string") {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    return "[FormData]";
  }
  try {
    return JSON.stringify(body, null, 2);
  } catch {
    return "[Unserializable body]";
  }
}
var Logger = class {
  /**
   * Creates a new Logger instance.
   * @param debug - Set to true to enable console logging, or pass a custom log function
   */
  constructor(debug) {
    if (typeof debug === "function") {
      this.enabled = true;
      this.customLog = debug;
    } else {
      this.enabled = !!debug;
      this.customLog = null;
    }
  }
  /**
   * Logs a debug message at the info level.
   * @param message - The message to log
   * @param args - Additional arguments to pass to the log function
   */
  log(message, ...args) {
    if (!this.enabled) {
      return;
    }
    const formatted = `[InsForge Debug] ${message}`;
    if (this.customLog) {
      this.customLog(formatted, ...args);
    } else {
      console.log(formatted, ...args);
    }
  }
  /**
   * Logs a debug message at the warning level.
   * @param message - The message to log
   * @param args - Additional arguments to pass to the log function
   */
  warn(message, ...args) {
    if (!this.enabled) {
      return;
    }
    const formatted = `[InsForge Debug] ${message}`;
    if (this.customLog) {
      this.customLog(formatted, ...args);
    } else {
      console.warn(formatted, ...args);
    }
  }
  /**
   * Logs a debug message at the error level.
   * @param message - The message to log
   * @param args - Additional arguments to pass to the log function
   */
  error(message, ...args) {
    if (!this.enabled) {
      return;
    }
    const formatted = `[InsForge Debug] ${message}`;
    if (this.customLog) {
      this.customLog(formatted, ...args);
    } else {
      console.error(formatted, ...args);
    }
  }
  /**
   * Logs an outgoing HTTP request with method, URL, headers, and body.
   * Sensitive headers and body fields are automatically redacted.
   * @param method - HTTP method (GET, POST, etc.)
   * @param url - The full request URL
   * @param headers - Request headers (sensitive values will be redacted)
   * @param body - Request body (sensitive fields will be masked)
   */
  logRequest(method, url2, headers, body) {
    if (!this.enabled) {
      return;
    }
    const parts2 = [`\u2192 ${method} ${url2}`];
    if (headers && Object.keys(headers).length > 0) {
      parts2.push(`  Headers: ${JSON.stringify(redactHeaders(headers))}`);
    }
    const formattedBody = formatBody(sanitizeBody(body));
    if (formattedBody) {
      const truncated = formattedBody.length > 1e3 ? formattedBody.slice(0, 1e3) + "... [truncated]" : formattedBody;
      parts2.push(`  Body: ${truncated}`);
    }
    this.log(parts2.join("\n"));
  }
  /**
   * Logs an incoming HTTP response with method, URL, status, duration, and body.
   * Error responses (4xx/5xx) are logged at the error level.
   * @param method - HTTP method (GET, POST, etc.)
   * @param url - The full request URL
   * @param status - HTTP response status code
   * @param durationMs - Request duration in milliseconds
   * @param body - Response body (sensitive fields will be masked, large bodies truncated)
   */
  logResponse(method, url2, status, durationMs, body) {
    if (!this.enabled) {
      return;
    }
    const parts2 = [`\u2190 ${method} ${url2} ${status} (${durationMs}ms)`];
    const formattedBody = formatBody(sanitizeBody(body));
    if (formattedBody) {
      const truncated = formattedBody.length > 1e3 ? formattedBody.slice(0, 1e3) + "... [truncated]" : formattedBody;
      parts2.push(`  Body: ${truncated}`);
    }
    if (status >= 400) {
      this.error(parts2.join("\n"));
    } else {
      this.log(parts2.join("\n"));
    }
  }
};
var AuthChangeEvent = {
  SIGNED_IN: "signedIn",
  SIGNED_OUT: "signedOut",
  TOKEN_REFRESHED: "tokenRefreshed"
};
var CSRF_TOKEN_COOKIE = "insforge_csrf_token";
function getCsrfToken() {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.split(";").find((c) => c.trim().startsWith(`${CSRF_TOKEN_COOKIE}=`));
  if (!match) {
    return null;
  }
  return match.split("=")[1] || null;
}
function setCsrfToken(token) {
  if (typeof document === "undefined") {
    return;
  }
  const maxAge = 7 * 24 * 60 * 60;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CSRF_TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}
function clearCsrfToken() {
  if (typeof document === "undefined") {
    return;
  }
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CSRF_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax${secure}`;
}
var TokenManager = class {
  constructor() {
    this.accessToken = null;
    this.user = null;
    this.authStateChangeCallbacks = /* @__PURE__ */ new Map();
  }
  /**
   * Save session in memory
   */
  saveSession(session, event = AuthChangeEvent.SIGNED_IN) {
    const tokenChanged = session.accessToken !== this.accessToken;
    this.accessToken = session.accessToken;
    this.user = session.user;
    if (tokenChanged) {
      this.notifyAuthStateChange(event);
    }
  }
  /**
   * Get current session
   */
  getSession() {
    if (!this.accessToken || !this.user) {
      return null;
    }
    return {
      accessToken: this.accessToken,
      user: this.user
    };
  }
  /**
   * Get access token
   */
  getAccessToken() {
    return this.accessToken;
  }
  /**
   * Set access token
   */
  setAccessToken(token, event = AuthChangeEvent.SIGNED_IN) {
    const tokenChanged = token !== this.accessToken;
    this.accessToken = token;
    if (tokenChanged) {
      this.notifyAuthStateChange(event);
    }
  }
  /**
   * Get user
   */
  getUser() {
    return this.user;
  }
  /**
   * Set user
   */
  setUser(user) {
    this.user = user;
  }
  /**
   * Clear in-memory session
   */
  clearSession() {
    const hadToken = this.accessToken !== null;
    this.accessToken = null;
    this.user = null;
    if (hadToken) {
      this.notifyAuthStateChange(AuthChangeEvent.SIGNED_OUT);
    }
  }
  onAuthStateChange(callback) {
    const id = /* @__PURE__ */ Symbol("auth-state-change");
    this.authStateChangeCallbacks.set(id, callback);
    return () => this.authStateChangeCallbacks.delete(id);
  }
  notifyAuthStateChange(event) {
    for (const callback of this.authStateChangeCallbacks.values()) {
      try {
        callback(event);
      } catch (error) {
        console.error("Error in auth state change callback:", error);
      }
    }
  }
};
function decodeBase64Url(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + (4 - normalized.length % 4) % 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function getJwtExpiration(token) {
  if (!token) {
    return null;
  }
  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }
  try {
    const parsed = JSON.parse(decodeBase64Url(payload));
    if (typeof parsed.exp !== "number" || !Number.isFinite(parsed.exp)) {
      return null;
    }
    return new Date(parsed.exp * 1e3);
  } catch {
    return null;
  }
}
function isJwtExpiredOrExpiring(token, leewaySeconds = 60) {
  if (!token) {
    return false;
  }
  const expires = getJwtExpiration(token);
  if (!expires) {
    return true;
  }
  return expires.getTime() <= Date.now() + leewaySeconds * 1e3;
}
var RETRYABLE_STATUS_CODES = /* @__PURE__ */ new Set([500, 502, 503, 504]);
var IDEMPOTENT_METHODS = /* @__PURE__ */ new Set(["GET", "HEAD", "PUT", "DELETE", "OPTIONS"]);
var REFRESHABLE_AUTH_ERROR_CODES = /* @__PURE__ */ new Set(["AUTH_UNAUTHORIZED", "PGRST301"]);
function serializeBody(method, body, headers) {
  if (body === void 0) {
    return void 0;
  }
  if (method === "GET" || method === "HEAD") {
    return void 0;
  }
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    return body;
  }
  headers["Content-Type"] = "application/json;charset=UTF-8";
  return JSON.stringify(body);
}
async function parseResponse(response) {
  if (response.status === 204) {
    return void 0;
  }
  let data;
  const contentType = response.headers.get("content-type");
  try {
    if (contentType?.includes("json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }
  } catch (parseErr) {
    throw new InsForgeError(
      `Failed to parse response body: ${parseErr?.message || "Unknown error"}`,
      response.status,
      response.ok ? "PARSE_ERROR" : "REQUEST_FAILED"
    );
  }
  if (!response.ok) {
    if (data && typeof data === "object" && "error" in data) {
      data.statusCode ?? (data.statusCode = data.status ?? response.status);
      const error = InsForgeError.fromApiError(data);
      Object.keys(data).forEach((key) => {
        if (key !== "error" && key !== "message" && key !== "statusCode") {
          error[key] = data[key];
        }
      });
      throw error;
    }
    throw new InsForgeError(
      `Request failed: ${response.statusText}`,
      response.status,
      "REQUEST_FAILED"
    );
  }
  return data;
}
var HttpClient = class {
  /**
   * Creates a new HttpClient instance.
   * @param config - SDK configuration including baseUrl, timeout, retry settings, and fetch implementation.
   * @param tokenManager - Token manager for session persistence.
   * @param logger - Optional logger instance for request/response debugging.
   */
  constructor(config, tokenManager, logger) {
    this.userToken = null;
    this.isRefreshing = false;
    this.refreshPromise = null;
    this.refreshToken = null;
    this.config = config;
    this.baseUrl = config.baseUrl || "http://localhost:7130";
    this.fetch = config.fetch || (globalThis.fetch ? globalThis.fetch.bind(globalThis) : void 0);
    this.anonKey = config.anonKey;
    this.defaultHeaders = {
      ...config.headers
    };
    this.tokenManager = tokenManager ?? new TokenManager();
    this.logger = logger || new Logger(false);
    this.timeout = config.timeout ?? 3e4;
    this.retryCount = config.retryCount ?? 3;
    this.retryDelay = config.retryDelay ?? 500;
    if (!this.fetch) {
      throw new Error(
        "Fetch is not available. Please provide a fetch implementation in the config."
      );
    }
  }
  /**
   * Builds a full URL from a path and optional query parameters.
   * Normalizes PostgREST select parameters for proper syntax.
   */
  buildUrl(path, params) {
    const url2 = new URL(path, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value2]) => {
        if (key === "select") {
          let normalizedValue = value2.replace(/\s+/g, " ").trim();
          normalizedValue = normalizedValue.replace(/\s*\(\s*/g, "(").replace(/\s*\)\s*/g, ")").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").replace(/,\s+(?=[^()]*\))/g, ",");
          url2.searchParams.append(key, normalizedValue);
        } else {
          url2.searchParams.append(key, value2);
        }
      });
    }
    return url2.toString();
  }
  /** Checks if an HTTP status code is eligible for retry (5xx server errors). */
  isRetryableStatus(status) {
    return RETRYABLE_STATUS_CODES.has(status);
  }
  /**
   * Computes the delay before the next retry using exponential backoff with jitter.
   * @param attempt - The current retry attempt number (1-based).
   * @returns Delay in milliseconds.
   */
  computeRetryDelay(attempt) {
    const base = this.retryDelay * Math.pow(2, attempt - 1);
    const jitter = base * (0.85 + Math.random() * 0.3);
    return Math.round(jitter);
  }
  shouldRefreshAccessToken(statusCode, errorCode, authToken, options = {}) {
    return statusCode === 401 && REFRESHABLE_AUTH_ERROR_CODES.has(errorCode ?? "") && !this.config.isServerMode && !this.config.accessToken && !this.config.edgeFunctionToken && !options.skipAuthRefresh && authToken !== null;
  }
  async fetchWithRetry(args) {
    const { method, url: url2, headers, body, fetchOptions, callerSignal, maxAttempts } = args;
    let lastError;
    for (let attempt = 0; attempt <= maxAttempts; attempt++) {
      if (attempt > 0) {
        const delay = this.computeRetryDelay(attempt);
        this.logger.warn(`Retry ${attempt}/${maxAttempts} for ${method} ${url2} in ${delay}ms`);
        if (callerSignal?.aborted) {
          throw callerSignal.reason;
        }
        await new Promise((resolve, reject) => {
          const onAbort = () => {
            clearTimeout(timer2);
            reject(callerSignal.reason);
          };
          const timer2 = setTimeout(() => {
            if (callerSignal) {
              callerSignal.removeEventListener("abort", onAbort);
            }
            resolve();
          }, delay);
          if (callerSignal) {
            callerSignal.addEventListener("abort", onAbort, { once: true });
          }
        });
      }
      let controller;
      let timer;
      if (this.timeout > 0 || callerSignal) {
        controller = new AbortController();
        if (this.timeout > 0) {
          timer = setTimeout(() => controller.abort(), this.timeout);
        }
        if (callerSignal) {
          if (callerSignal.aborted) {
            controller.abort(callerSignal.reason);
          } else {
            const onCallerAbort = () => controller.abort(callerSignal.reason);
            callerSignal.addEventListener("abort", onCallerAbort, {
              once: true
            });
            controller.signal.addEventListener(
              "abort",
              () => {
                callerSignal.removeEventListener("abort", onCallerAbort);
              },
              { once: true }
            );
          }
        }
      }
      try {
        const response = await this.fetch(url2, {
          method,
          headers,
          body,
          ...fetchOptions,
          ...controller ? { signal: controller.signal } : {}
        });
        if (this.isRetryableStatus(response.status) && attempt < maxAttempts) {
          if (timer !== void 0) {
            clearTimeout(timer);
          }
          await response.body?.cancel();
          lastError = new InsForgeError(
            `Server error: ${response.status} ${response.statusText}`,
            response.status,
            "SERVER_ERROR"
          );
          continue;
        }
        if (timer !== void 0) {
          clearTimeout(timer);
        }
        return response;
      } catch (err) {
        if (timer !== void 0) {
          clearTimeout(timer);
        }
        if (err?.name === "AbortError") {
          if (controller && controller.signal.aborted && this.timeout > 0 && !callerSignal?.aborted) {
            throw new InsForgeError(
              `Request timed out after ${this.timeout}ms`,
              408,
              "REQUEST_TIMEOUT"
            );
          }
          throw err;
        }
        if (attempt < maxAttempts) {
          lastError = err;
          continue;
        }
        throw new InsForgeError(
          `Network request failed: ${err?.message || "Unknown error"}`,
          0,
          "NETWORK_ERROR"
        );
      }
    }
    throw lastError || new InsForgeError("Request failed after all retry attempts", 0, "NETWORK_ERROR");
  }
  /**
   * Performs an HTTP request with automatic retry and timeout handling.
   * Retries on network errors and 5xx server errors with exponential backoff.
   * Client errors (4xx) and timeouts are thrown immediately without retry.
   * @param method - HTTP method (GET, POST, PUT, PATCH, DELETE).
   * @param path - API path relative to the base URL.
   * @param options - Optional request configuration including headers, body, and query params.
   * @returns Parsed response data.
   * @throws {InsForgeError} On timeout, network failure, or HTTP error responses.
   */
  async handleRequest(method, path, options = {}, tokenOverride) {
    const {
      params,
      headers = {},
      body,
      skipAuthRefresh: _skipAuthRefresh,
      signal: callerSignal,
      ...fetchOptions
    } = options;
    const url2 = this.buildUrl(path, params);
    const startTime = Date.now();
    const canRetry = IDEMPOTENT_METHODS.has(method.toUpperCase()) || options.idempotent === true;
    const maxAttempts = canRetry ? this.retryCount : 0;
    const requestHeaders = {
      ...this.defaultHeaders
    };
    const authToken = tokenOverride ?? this.userToken ?? this.anonKey;
    if (authToken) {
      requestHeaders["Authorization"] = `Bearer ${authToken}`;
    }
    const processedBody = serializeBody(method, body, requestHeaders);
    const setRequestHeader = (key, value2) => {
      if (key.toLowerCase() === "authorization") {
        delete requestHeaders["Authorization"];
        delete requestHeaders["authorization"];
        requestHeaders["Authorization"] = value2;
        return;
      }
      requestHeaders[key] = value2;
    };
    if (headers instanceof Headers) {
      headers.forEach((value2, key) => {
        setRequestHeader(key, value2);
      });
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value2]) => {
        setRequestHeader(key, value2);
      });
    } else {
      Object.entries(headers).forEach(([key, value2]) => {
        setRequestHeader(key, value2);
      });
    }
    this.logger.logRequest(method, url2, requestHeaders, processedBody);
    const response = await this.fetchWithRetry({
      method,
      url: url2,
      headers: requestHeaders,
      body: processedBody,
      fetchOptions,
      callerSignal,
      maxAttempts
    });
    let data;
    try {
      data = await parseResponse(response);
    } catch (err) {
      if (err instanceof InsForgeError) {
        this.logger.logResponse(
          method,
          url2,
          err.statusCode || response.status,
          Date.now() - startTime,
          err
        );
      }
      throw err;
    }
    this.logger.logResponse(method, url2, response.status, Date.now() - startTime, data);
    return data;
  }
  async request(method, path, options = {}) {
    const tokenUsed = this.userToken;
    try {
      return await this.handleRequest(method, path, { ...options }, tokenUsed);
    } catch (error) {
      if (!(error instanceof InsForgeError) || !this.shouldRefreshAccessToken(error.statusCode, error.error, tokenUsed, options)) {
        throw error;
      }
      if (tokenUsed !== this.userToken) {
        if (this.userToken === null) {
          throw error;
        }
        return await this.handleRequest(
          method,
          path,
          {
            ...options,
            skipAuthRefresh: true
          },
          this.userToken
        );
      }
      try {
        await this.refreshAndSaveSession();
      } catch (error2) {
        if (error2 instanceof InsForgeError && (error2.statusCode === 401 || error2.statusCode === 403)) {
          this.clearAuthSession();
        }
        throw error2;
      }
      return await this.handleRequest(method, path, {
        ...options,
        skipAuthRefresh: true
      });
    }
  }
  /**
   * Performs an SDK-configured fetch and returns the raw Response.
   * This is used by clients such as postgrest-js that need to own response
   * parsing while still sharing SDK auth and refresh behavior.
   */
  async rawFetch(input, init, options = {}) {
    const request = typeof Request !== "undefined" && input instanceof Request ? input : void 0;
    const {
      method: initMethod,
      headers: initHeaders,
      body: initBody,
      signal: initSignal,
      ...fetchOptions
    } = init ?? {};
    const method = initMethod ?? request?.method ?? "GET";
    const url2 = request?.url ?? input.toString();
    const startTime = Date.now();
    const tokenUsed = this.userToken;
    const headers = new Headers({
      ...this.defaultHeaders
    });
    const authToken = tokenUsed ?? this.anonKey;
    if (authToken) {
      headers.set("Authorization", `Bearer ${authToken}`);
    }
    request?.headers.forEach((value2, key) => {
      headers.set(key, value2);
    });
    new Headers(initHeaders).forEach((value2, key) => {
      headers.set(key, value2);
    });
    const requestHeaders = {};
    headers.forEach((value2, key) => {
      requestHeaders[key] = value2;
    });
    const sourceBody = initBody ?? request?.body ?? void 0;
    let body = sourceBody;
    let retryInit = init;
    if (typeof ReadableStream !== "undefined" && sourceBody instanceof ReadableStream) {
      body = await new Response(sourceBody).arrayBuffer();
      retryInit = { ...init ?? {}, body };
    }
    const callerSignal = initSignal ?? request?.signal;
    const maxAttempts = IDEMPOTENT_METHODS.has(method.toUpperCase()) ? this.retryCount : 0;
    this.logger.logRequest(method, url2, requestHeaders, body);
    const response = await this.fetchWithRetry({
      method,
      url: url2,
      headers: requestHeaders,
      body,
      fetchOptions,
      callerSignal,
      maxAttempts
    });
    this.logger.logResponse(method, url2, response.status, Date.now() - startTime);
    let errorCode = null;
    if (response.status === 401) {
      try {
        const data = await response.clone().json();
        if (data && typeof data === "object") {
          const candidate = data.error ?? data.code;
          if (typeof candidate === "string") {
            errorCode = candidate;
          }
        }
      } catch {
      }
    }
    if (!this.shouldRefreshAccessToken(response.status, errorCode, tokenUsed, options)) {
      return response;
    }
    if (tokenUsed !== this.userToken) {
      if (this.userToken === null) {
        return response;
      }
      const retryHeaders2 = new Headers(initHeaders);
      retryHeaders2.set("Authorization", `Bearer ${this.userToken}`);
      return await this.rawFetch(
        input,
        { ...retryInit, headers: retryHeaders2 },
        { skipAuthRefresh: true }
      );
    }
    let newTokenData;
    try {
      newTokenData = await this.refreshAndSaveSession();
    } catch (error) {
      if (error instanceof InsForgeError && (error.statusCode === 401 || error.statusCode === 403)) {
        this.clearAuthSession();
      }
      throw error;
    }
    const retryHeaders = new Headers(initHeaders);
    retryHeaders.set("Authorization", `Bearer ${newTokenData.accessToken}`);
    return await this.rawFetch(
      input,
      { ...retryInit, headers: retryHeaders },
      { skipAuthRefresh: true }
    );
  }
  /** Performs a GET request. */
  get(path, options) {
    return this.request("GET", path, options);
  }
  /** Performs a POST request with an optional JSON body. */
  post(path, body, options) {
    return this.request("POST", path, { ...options, body });
  }
  /** Performs a PUT request with an optional JSON body. */
  put(path, body, options) {
    return this.request("PUT", path, { ...options, body });
  }
  /** Performs a PATCH request with an optional JSON body. */
  patch(path, body, options) {
    return this.request("PATCH", path, { ...options, body });
  }
  /** Performs a DELETE request. */
  delete(path, options) {
    return this.request("DELETE", path, options);
  }
  /** Sets or clears the user authentication token for subsequent requests. */
  setAuthToken(token) {
    this.userToken = token;
  }
  setRefreshToken(token) {
    this.refreshToken = token;
  }
  /** Returns the current default headers including the authorization header if set. */
  getHeaders() {
    const headers = { ...this.defaultHeaders };
    const authToken = this.userToken || this.anonKey;
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }
    return headers;
  }
  async refreshAccessToken() {
    if (this.isRefreshing) {
      return this.refreshPromise;
    }
    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const csrfToken = getCsrfToken();
        const body = this.refreshToken ? { refreshToken: this.refreshToken } : void 0;
        const response = await this.handleRequest(
          "POST",
          this.refreshToken ? "/api/auth/refresh?client_type=mobile" : "/api/auth/refresh",
          {
            body,
            headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {},
            credentials: "include"
          }
        );
        return response;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();
    return this.refreshPromise;
  }
  /** Returns a token safe to use for a new connection handshake. */
  async getValidAccessToken(leewaySeconds = 60) {
    const accessToken = this.tokenManager.getAccessToken() ?? this.userToken;
    if (!accessToken || !isJwtExpiredOrExpiring(accessToken, leewaySeconds)) {
      return accessToken;
    }
    const canRefresh = !this.config.isServerMode && !this.config.accessToken && !this.config.edgeFunctionToken && this.userToken !== null;
    if (!canRefresh) {
      return accessToken;
    }
    try {
      const refreshed = await this.refreshAndSaveSession();
      return refreshed.accessToken;
    } catch (error) {
      if (error instanceof InsForgeError && (error.statusCode === 401 || error.statusCode === 403) && this.userToken === accessToken) {
        this.clearAuthSession();
      }
      throw error;
    }
  }
  async refreshAndSaveSession() {
    const newTokenData = await this.refreshAccessToken();
    this.setAuthToken(newTokenData.accessToken);
    this.tokenManager.saveSession(newTokenData, AuthChangeEvent.TOKEN_REFRESHED);
    if (newTokenData.csrfToken) {
      setCsrfToken(newTokenData.csrfToken);
    }
    if (newTokenData.refreshToken) {
      this.setRefreshToken(newTokenData.refreshToken);
    }
    return newTokenData;
  }
  clearAuthSession() {
    this.tokenManager.clearSession();
    this.userToken = null;
    this.refreshToken = null;
    clearCsrfToken();
  }
};
var PKCE_VERIFIER_KEY = "insforge_pkce_verifier";
async function getWebCrypto() {
  const webCrypto = globalThis.crypto;
  if (typeof webCrypto?.getRandomValues === "function" && webCrypto.subtle) {
    return webCrypto;
  }
  if (typeof process !== "undefined" && process.versions?.node) {
    const { webcrypto: webcrypto2 } = await Promise.resolve().then(() => (init_crypto_shim(), crypto_shim_exports));
    return webcrypto2;
  }
  throw new Error("Web Crypto API is not available in this environment");
}
function base64UrlEncode(buffer) {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function generateCodeVerifier() {
  const webCrypto = await getWebCrypto();
  const array = new Uint8Array(32);
  webCrypto.getRandomValues(array);
  return base64UrlEncode(array);
}
async function generateCodeChallenge(verifier) {
  const webCrypto = await getWebCrypto();
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await webCrypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
}
function storePkceVerifier(verifier) {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  }
}
function retrievePkceVerifier() {
  if (typeof sessionStorage === "undefined") {
    return null;
  }
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
  if (verifier) {
    sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  }
  return verifier;
}
function wrapError(error, fallbackMessage) {
  if (error instanceof InsForgeError) {
    return { data: null, error };
  }
  return {
    data: null,
    error: new InsForgeError(
      error instanceof Error ? error.message : fallbackMessage,
      500,
      "UNEXPECTED_ERROR"
    )
  };
}
function cleanUrlParams(...params) {
  if (typeof window === "undefined") {
    return;
  }
  const url2 = new URL(window.location.href);
  params.forEach((p) => url2.searchParams.delete(p));
  window.history.replaceState({}, document.title, url2.toString());
}
var Auth = class {
  constructor(http, tokenManager, options = {}) {
    this.http = http;
    this.tokenManager = tokenManager;
    this.options = options;
    this.authCallbackHandled = options.detectOAuthCallback === false ? Promise.resolve() : this.detectAuthCallback();
  }
  isServerMode() {
    return !!this.options.isServerMode;
  }
  /** Subscribe to SDK authentication state changes. */
  onAuthStateChange(callback) {
    return this.tokenManager.onAuthStateChange(callback);
  }
  /**
   * Save session from API response
   * Handles token storage, CSRF token, and HTTP auth header
   */
  saveSessionFromResponse(response, event = AuthChangeEvent.SIGNED_IN) {
    if (!response.accessToken || !response.user) {
      return false;
    }
    const session = {
      accessToken: response.accessToken,
      user: response.user
    };
    if (!this.isServerMode() && response.csrfToken) {
      setCsrfToken(response.csrfToken);
    }
    if (!this.isServerMode()) {
      this.tokenManager.saveSession(session, event);
    }
    this.http.setAuthToken(response.accessToken);
    this.http.setRefreshToken(response.refreshToken ?? null);
    return true;
  }
  // ============================================================================
  // OAuth Callback Detection (runs on initialization)
  // ============================================================================
  /**
   * Detect and handle OAuth callback parameters in URL
   * Supports PKCE flow (insforge_code)
   */
  async detectAuthCallback() {
    if (this.isServerMode() || typeof window === "undefined") {
      return;
    }
    try {
      const params = new URLSearchParams(window.location.search);
      const error = params.get("error");
      if (error) {
        cleanUrlParams("error");
        console.debug("OAuth callback error:", error);
        return;
      }
      const code = params.get("insforge_code");
      if (code) {
        cleanUrlParams("insforge_code");
        const { error: exchangeError } = await this.exchangeOAuthCode(code);
        if (exchangeError) {
          console.debug("OAuth code exchange failed:", exchangeError.message);
        }
        return;
      }
    } catch (error) {
      console.debug("OAuth callback detection skipped:", error);
    }
  }
  // ============================================================================
  // Sign Up / Sign In / Sign Out
  // ============================================================================
  async signUp(request) {
    try {
      const response = await this.http.post(
        this.isServerMode() ? "/api/auth/users?client_type=mobile" : "/api/auth/users",
        request,
        { credentials: "include", skipAuthRefresh: true }
      );
      if (response.accessToken && response.user) {
        this.saveSessionFromResponse(response);
      }
      if (response.refreshToken) {
        this.http.setRefreshToken(response.refreshToken);
      }
      return { data: response, error: null };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred during sign up");
    }
  }
  async signInWithPassword(request) {
    try {
      const response = await this.http.post(
        this.isServerMode() ? "/api/auth/sessions?client_type=mobile" : "/api/auth/sessions",
        request,
        { credentials: "include", skipAuthRefresh: true }
      );
      this.saveSessionFromResponse(response);
      if (response.refreshToken) {
        this.http.setRefreshToken(response.refreshToken);
      }
      return { data: response, error: null };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred during sign in");
    }
  }
  /**
   * Send a one-time sign-in code to an email address.
   *
   * The response is intentionally generic whether or not an account exists, to
   * avoid account enumeration. Complete the flow with {@link Auth.verifyOtp}.
   */
  async signInWithOtp(request) {
    try {
      const response = await this.http.post(
        "/api/auth/email/send-otp",
        request,
        { skipAuthRefresh: true }
      );
      return { data: response, error: null };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred while sending the sign-in code");
    }
  }
  /**
   * Verify an email sign-in code and create a session.
   *
   * If the email is new, a verified passwordless user is created; `name` sets
   * the display name only on that first-time creation.
   */
  async verifyOtp(request) {
    try {
      const response = await this.http.post(
        this.isServerMode() ? "/api/auth/sessions?client_type=mobile" : "/api/auth/sessions",
        // method is set last so it can never be clobbered by an untyped caller's payload.
        { ...request, method: "otp" },
        { credentials: "include", skipAuthRefresh: true }
      );
      this.saveSessionFromResponse(response);
      if (response.refreshToken) {
        this.http.setRefreshToken(response.refreshToken);
      }
      return { data: response, error: null };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred during sign in");
    }
  }
  async signOut() {
    try {
      try {
        const serverMode = this.isServerMode();
        const csrfToken = !serverMode ? getCsrfToken() : null;
        await this.http.post(
          serverMode ? "/api/auth/logout?client_type=mobile" : "/api/auth/logout",
          void 0,
          {
            credentials: "include",
            skipAuthRefresh: true,
            ...csrfToken ? { headers: { "X-CSRF-Token": csrfToken } } : {}
          }
        );
      } catch {
      }
      this.tokenManager.clearSession();
      this.http.setAuthToken(null);
      this.http.setRefreshToken(null);
      if (!this.isServerMode()) {
        clearCsrfToken();
      }
      return { error: null };
    } catch {
      return {
        error: new InsForgeError("Failed to sign out", 500, "SIGNOUT_ERROR")
      };
    }
  }
  async signInWithOAuth(providerOrOptions, options) {
    try {
      let signInOptions;
      if (typeof providerOrOptions === "object") {
        signInOptions = providerOrOptions;
      } else if (options) {
        signInOptions = { provider: providerOrOptions, ...options };
      } else {
        return {
          data: {},
          error: new InsForgeError(
            "OAuth sign-in options are required",
            400,
            ERROR_CODES.INVALID_INPUT
          )
        };
      }
      if (!signInOptions || !signInOptions.redirectTo) {
        return {
          data: {},
          error: new InsForgeError("Redirect URI is required", 400, ERROR_CODES.INVALID_INPUT)
        };
      }
      const { provider } = signInOptions;
      const providerKey = encodeURIComponent(provider.toLowerCase());
      const codeVerifier = await generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      storePkceVerifier(codeVerifier);
      const params = {
        ...signInOptions.additionalParams ?? {},
        redirect_uri: signInOptions.redirectTo,
        code_challenge: codeChallenge
      };
      const isBuiltInProvider = oAuthProvidersSchema.options.includes(
        providerKey
      );
      const oauthPath = isBuiltInProvider ? `/api/auth/oauth/${providerKey}` : `/api/auth/oauth/custom/${providerKey}`;
      const response = await this.http.get(oauthPath, {
        params,
        skipAuthRefresh: true
      });
      if (!this.isServerMode() && typeof window !== "undefined" && !signInOptions.skipBrowserRedirect) {
        window.location.href = response.authUrl;
        return { data: {}, error: null };
      }
      return {
        data: { url: response.authUrl, provider: providerKey, codeVerifier },
        error: null
      };
    } catch (error) {
      if (error instanceof InsForgeError) {
        return { data: {}, error };
      }
      return {
        data: {},
        error: new InsForgeError(
          "An unexpected error occurred during OAuth initialization",
          500,
          "UNEXPECTED_ERROR"
        )
      };
    }
  }
  /**
   * Exchange OAuth authorization code for tokens (PKCE flow)
   * Called automatically on initialization when insforge_code is in URL
   */
  async exchangeOAuthCode(code, codeVerifier) {
    try {
      const verifier = codeVerifier ?? retrievePkceVerifier();
      if (!verifier) {
        return {
          data: null,
          error: new InsForgeError(
            "PKCE code verifier not found. Ensure signInWithOAuth was called in the same browser session.",
            400,
            "PKCE_VERIFIER_MISSING"
          )
        };
      }
      const request = {
        code,
        code_verifier: verifier
      };
      const response = await this.http.post(
        this.isServerMode() ? "/api/auth/oauth/exchange?client_type=mobile" : "/api/auth/oauth/exchange",
        request,
        { credentials: "include", skipAuthRefresh: true }
      );
      this.saveSessionFromResponse(response);
      return {
        data: response,
        error: null
      };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred during OAuth code exchange");
    }
  }
  /**
   * Sign in with an ID token from a native SDK (Google One Tap, etc.)
   * Use this for native mobile apps or Google One Tap on web.
   *
   * @param credentials.provider - The identity provider (currently only 'google' is supported)
   * @param credentials.token - The ID token from the native SDK
   */
  async signInWithIdToken(credentials) {
    try {
      const { provider, token } = credentials;
      const response = await this.http.post(
        "/api/auth/id-token?client_type=mobile",
        { provider, token },
        { credentials: "include", skipAuthRefresh: true }
      );
      this.saveSessionFromResponse(response);
      if (response.refreshToken) {
        this.http.setRefreshToken(response.refreshToken);
      }
      return {
        data: response,
        error: null
      };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred during ID token sign in");
    }
  }
  // ============================================================================
  // Session Management
  // ============================================================================
  /**
   * Refresh the current auth session.
   *
   * Browser mode:
   * - Uses httpOnly refresh cookie and optional CSRF header.
   *
   * Legacy server mode (`isServerMode: true`):
   * - Uses mobile auth flow and requires `refreshToken` in request body.
   *
   * SSR apps should prefer `createRefreshAuthRouter()` / `refreshAuth()` from
   * `@insforge/sdk/ssr`.
   */
  async refreshSession(options) {
    try {
      if (this.isServerMode() && !options?.refreshToken) {
        return {
          data: null,
          error: new InsForgeError(
            "refreshToken is required when refreshing session in server mode",
            400,
            ERROR_CODES.AUTH_UNAUTHORIZED
          )
        };
      }
      const csrfToken = !this.isServerMode() ? getCsrfToken() : null;
      const response = await this.http.post(
        this.isServerMode() ? "/api/auth/refresh?client_type=mobile" : "/api/auth/refresh",
        this.isServerMode() ? { refresh_token: options?.refreshToken } : void 0,
        {
          headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {},
          credentials: "include",
          skipAuthRefresh: true
        }
      );
      if (response.accessToken) {
        this.saveSessionFromResponse(response, AuthChangeEvent.TOKEN_REFRESHED);
      }
      return { data: response, error: null };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred during session refresh");
    }
  }
  /**
   * Get current user, automatically waits for pending OAuth callback
   */
  async getCurrentUser() {
    await this.authCallbackHandled;
    try {
      if (this.isServerMode()) {
        const accessToken = this.tokenManager.getAccessToken();
        if (!accessToken) {
          return { data: { user: null }, error: null };
        }
        this.http.setAuthToken(accessToken);
        const response = await this.http.get("/api/auth/sessions/current");
        const user = response.user ?? null;
        return { data: { user }, error: null };
      }
      const session = this.tokenManager.getSession();
      if (session) {
        this.http.setAuthToken(session.accessToken);
        return { data: { user: session.user }, error: null };
      }
      if (typeof window !== "undefined") {
        const { data: refreshed, error: refreshError } = await this.refreshSession();
        if (refreshError) {
          return { data: { user: null }, error: refreshError };
        }
        if (refreshed?.accessToken) {
          return { data: { user: refreshed.user ?? null }, error: null };
        }
      }
      return { data: { user: null }, error: null };
    } catch (error) {
      if (error instanceof InsForgeError) {
        return { data: { user: null }, error };
      }
      return {
        data: { user: null },
        error: new InsForgeError(
          "An unexpected error occurred while getting user",
          500,
          "UNEXPECTED_ERROR"
        )
      };
    }
  }
  // ============================================================================
  // Profile Management
  // ============================================================================
  async getProfile(userId) {
    try {
      const response = await this.http.get(`/api/auth/profiles/${userId}`);
      return { data: response, error: null };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred while fetching user profile");
    }
  }
  async setProfile(profile) {
    try {
      const response = await this.http.patch("/api/auth/profiles/current", {
        profile
      });
      const currentUser = this.tokenManager.getUser();
      if (!this.isServerMode() && currentUser && response.profile !== void 0) {
        this.tokenManager.setUser({
          ...currentUser,
          profile: response.profile
        });
      }
      return { data: response, error: null };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred while updating user profile");
    }
  }
  // ============================================================================
  // Email Verification
  // ============================================================================
  async resendVerificationEmail(request) {
    try {
      const response = await this.http.post("/api/auth/email/send-verification", request, {
        skipAuthRefresh: true
      });
      return { data: response, error: null };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred while sending verification email");
    }
  }
  async verifyEmail(request) {
    try {
      const response = await this.http.post(
        this.isServerMode() ? "/api/auth/email/verify?client_type=mobile" : "/api/auth/email/verify",
        request,
        { credentials: "include", skipAuthRefresh: true }
      );
      this.saveSessionFromResponse(response);
      if (response.refreshToken) {
        this.http.setRefreshToken(response.refreshToken);
      }
      return { data: response, error: null };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred while verifying email");
    }
  }
  // ============================================================================
  // Password Reset
  // ============================================================================
  async sendResetPasswordEmail(request) {
    try {
      const response = await this.http.post("/api/auth/email/send-reset-password", request, {
        skipAuthRefresh: true
      });
      return { data: response, error: null };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred while sending password reset email");
    }
  }
  async exchangeResetPasswordToken(request) {
    try {
      const response = await this.http.post(
        "/api/auth/email/exchange-reset-password-token",
        request,
        { skipAuthRefresh: true }
      );
      return { data: response, error: null };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred while verifying reset code");
    }
  }
  async resetPassword(request) {
    try {
      const response = await this.http.post(
        "/api/auth/email/reset-password",
        request,
        { skipAuthRefresh: true }
      );
      return { data: response, error: null };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred while resetting password");
    }
  }
  // ============================================================================
  // Configuration
  // ============================================================================
  async getPublicAuthConfig() {
    try {
      const response = await this.http.get("/api/auth/public-config", {
        skipAuthRefresh: true
      });
      return { data: response, error: null };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred while fetching auth configuration");
    }
  }
};
function createInsForgePostgrestFetch(httpClient) {
  return async (input, init) => {
    const url2 = typeof input === "string" ? input : input.toString();
    const urlObj = new URL(url2);
    const pathname = urlObj.pathname.slice(1);
    const rpcMatch = pathname.match(/^rpc\/(.+)$/);
    const endpoint = rpcMatch ? `/api/database/rpc/${rpcMatch[1]}` : `/api/database/records/${pathname}`;
    const insforgeUrl = `${httpClient.baseUrl}${endpoint}${urlObj.search}`;
    const headers = new Headers(httpClient.getHeaders());
    new Headers(init?.headers).forEach((value2, key) => {
      headers.set(key, value2);
    });
    const response = await httpClient.rawFetch(insforgeUrl, {
      ...init,
      headers
    });
    return response;
  };
}
var Database = class {
  constructor(httpClient, defaultSchema) {
    this.postgrest = new PostgrestClient("http://dummy", {
      fetch: createInsForgePostgrestFetch(httpClient),
      headers: {},
      ...defaultSchema ? { schema: defaultSchema } : {}
    });
  }
  /**
   * Select a non-default Postgres schema for the chained query. Maps to
   * PostgREST's `Accept-Profile` (reads) / `Content-Profile` (writes) header.
   * The schema must be exposed by the backend.
   *
   * @example
   * const { data } = await client.database
   *   .schema('analytics')
   *   .from('events')
   *   .select('*');
   *
   * @example
   * await client.database.schema('analytics').rpc('rollup', { day: '2026-01-01' });
   */
  schema(schemaName) {
    return this.postgrest.schema(schemaName);
  }
  /**
   * Create a query builder for a table
   *
   * @example
   * // Basic query
   * const { data, error } = await client.database
   *   .from('posts')
   *   .select('*')
   *   .eq('user_id', userId);
   *
   * // With count (Supabase style!)
   * const { data, error, count } = await client.database
   *   .from('posts')
   *   .select('*', { count: 'exact' })
   *   .range(0, 9);
   *
   * // Just get count, no data
   * const { count } = await client.database
   *   .from('posts')
   *   .select('*', { count: 'exact', head: true });
   *
   * // Complex queries with OR
   * const { data } = await client.database
   *   .from('posts')
   *   .select('*, users!inner(*)')
   *   .or('status.eq.active,status.eq.pending');
   *
   * // All features work:
   * - Nested selects
   * - Foreign key expansion
   * - OR/AND/NOT conditions
   * - Count with head
   * - Range pagination
   * - Upserts
   */
  from(table) {
    return this.postgrest.from(table);
  }
  /**
   * Call a PostgreSQL function (RPC)
   *
   * @example
   * // Call a function with parameters
   * const { data, error } = await client.database
   *   .rpc('get_user_stats', { user_id: 123 });
   *
   * // Call a function with no parameters
   * const { data, error } = await client.database
   *   .rpc('get_all_active_users');
   *
   * // With options (head, count, get)
   * const { data, count } = await client.database
   *   .rpc('search_posts', { query: 'hello' }, { count: 'exact' });
   */
  rpc(fn, args, options) {
    return this.postgrest.rpc(fn, args, options);
  }
};
function generateObjectKey(filename) {
  const dotIndex = filename.lastIndexOf(".");
  const hasExt = dotIndex > 0;
  const ext = hasExt ? filename.slice(dotIndex) : "";
  const base = hasExt ? filename.slice(0, dotIndex) : filename;
  const sanitizedBase = base.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 32) || "file";
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${sanitizedBase}-${timestamp}-${random}${ext}`;
}
var StorageBucket = class {
  constructor(bucketName, http) {
    this.bucketName = bucketName;
    this.http = http;
  }
  /**
   * Upload a file to a specific key.
   * Uses the upload strategy from the backend (direct or presigned).
   * Standard PUT semantics: uploading to an existing key replaces the
   * current object in place.
   * @param path - The object key/path
   * @param file - File or Blob to upload
   */
  async upload(path, file) {
    try {
      const strategyResponse = await this.http.post(
        `/api/storage/buckets/${this.bucketName}/upload-strategy`,
        {
          filename: path,
          contentType: file.type || "application/octet-stream",
          size: file.size
        }
      );
      if (strategyResponse.method === "presigned") {
        return await this.uploadWithPresignedUrl(strategyResponse, file);
      }
      if (strategyResponse.method === "direct") {
        const formData = new FormData();
        formData.append("file", file);
        const response = await this.http.request(
          "PUT",
          `/api/storage/buckets/${this.bucketName}/objects/${encodeURIComponent(path)}`,
          {
            body: formData,
            headers: {
              // Don't set Content-Type, let browser set multipart boundary
            }
          }
        );
        return { data: response, error: null };
      }
      throw new InsForgeError(
        `Unsupported upload method: ${strategyResponse.method}`,
        500,
        "STORAGE_ERROR"
      );
    } catch (error) {
      return {
        data: null,
        error: error instanceof InsForgeError ? error : new InsForgeError("Upload failed", 500, "STORAGE_ERROR")
      };
    }
  }
  /**
   * Upload a file under an automatically generated, collision-free key.
   * The key is derived client-side from the filename (sanitized base +
   * timestamp + random suffix) and uploaded through the standard
   * {@link upload} path, so repeated uploads of the same file never
   * overwrite each other. Reads the filename structurally to avoid assuming
   * a global `File` (which Node 18 does not expose).
   * @param file - File or Blob to upload
   */
  async uploadAuto(file) {
    const filename = "name" in file && typeof file.name === "string" ? file.name : "file";
    return this.upload(generateObjectKey(filename), file);
  }
  /**
   * Internal method to handle presigned URL uploads
   */
  async uploadWithPresignedUrl(strategy, file) {
    try {
      const formData = new FormData();
      if (strategy.fields) {
        Object.entries(strategy.fields).forEach(([key, value2]) => {
          formData.append(key, value2);
        });
      }
      formData.append("file", file);
      const uploadResponse = await fetch(strategy.uploadUrl, {
        method: "POST",
        body: formData
      });
      if (!uploadResponse.ok) {
        throw new InsForgeError(
          `Upload to storage failed: ${uploadResponse.statusText}`,
          uploadResponse.status,
          "STORAGE_ERROR"
        );
      }
      if (strategy.confirmRequired && strategy.confirmUrl) {
        const confirmResponse = await this.http.post(strategy.confirmUrl, {
          size: file.size,
          contentType: file.type || "application/octet-stream"
        });
        return { data: confirmResponse, error: null };
      }
      return {
        data: {
          key: strategy.key,
          bucket: this.bucketName,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
          url: this.getPublicUrl(strategy.key).data.publicUrl
        },
        error: null
      };
    } catch (error) {
      throw error instanceof InsForgeError ? error : new InsForgeError("Presigned upload failed", 500, "STORAGE_ERROR");
    }
  }
  /**
   * Download a file
   * Uses the download strategy from backend (direct or presigned)
   * @param path - The object key/path
   * Returns the file as a Blob
   */
  async download(path) {
    try {
      const encodedKey = encodeURIComponent(path);
      let strategyResponse;
      try {
        strategyResponse = await this.http.get(
          `/api/storage/buckets/${this.bucketName}/download-strategy/objects/${encodedKey}`
        );
      } catch (err) {
        const status = err instanceof InsForgeError ? err.statusCode : void 0;
        if (status === 404 || status === 405) {
          strategyResponse = await this.http.post(
            `/api/storage/buckets/${this.bucketName}/objects/${encodedKey}/download-strategy`,
            {}
          );
        } else {
          throw err;
        }
      }
      const downloadUrl = strategyResponse.url;
      const headers = {};
      if (strategyResponse.method === "direct") {
        Object.assign(headers, this.http.getHeaders());
      }
      const response = await fetch(downloadUrl, {
        method: "GET",
        headers
      });
      if (!response.ok) {
        try {
          const error = await response.json();
          throw InsForgeError.fromApiError(error);
        } catch {
          throw new InsForgeError(
            `Download failed: ${response.statusText}`,
            response.status,
            "STORAGE_ERROR"
          );
        }
      }
      const blob = await response.blob();
      return { data: blob, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof InsForgeError ? error : new InsForgeError("Download failed", 500, "STORAGE_ERROR")
      };
    }
  }
  /**
   * Get the public URL for an object in a public bucket.
   *
   * Pure string construction — no network call, no auth. The URL only resolves
   * if the bucket is public; for private objects use {@link createSignedUrl}.
   *
   * @param path - The object key/path
   * @returns `{ data: { publicUrl }, error }` — matches the external SDK pattern,
   *   so `const { data } = getPublicUrl(path)` then `data.publicUrl`.
   */
  getPublicUrl(path) {
    const publicUrl = `${this.http.baseUrl}/api/storage/buckets/${this.bucketName}/objects/${encodeURIComponent(path)}`;
    return { data: { publicUrl }, error: null };
  }
  /**
   * Resolve a download strategy (signed or direct URL) for an object with a
   * caller-supplied TTL. Prefers the canonical GET route and falls back to the
   * legacy POST alias so signed-URL creation still works against older backends
   * that predate the GET route (they return 404/405 for it). A genuine
   * "object not found" (STORAGE_NOT_FOUND) is not retried.
   */
  async requestDownloadStrategy(path, expiresIn) {
    const encoded = encodeURIComponent(path);
    try {
      return await this.http.get(
        `/api/storage/buckets/${this.bucketName}/download-strategy/objects/${encoded}`,
        { params: { expiresIn: expiresIn.toString() } }
      );
    } catch (error) {
      const status = error instanceof InsForgeError ? error.statusCode : void 0;
      const isMissingRoute = (status === 404 || status === 405) && !(error instanceof InsForgeError && error.error === "STORAGE_NOT_FOUND");
      if (!isMissingRoute) {
        throw error;
      }
      return await this.http.post(
        `/api/storage/buckets/${this.bucketName}/objects/${encoded}/download-strategy`,
        { expiresIn }
      );
    }
  }
  /**
   * Create a signed URL for an object.
   *
   * Returns a time-limited, credential-free URL that can be handed directly to
   * a browser (`<img src>`), an email, or a third party — no SDK or session is
   * needed to fetch it. Authorization is enforced when the URL is minted (the
   * caller must be allowed to read the object), so the resulting link is a
   * pre-authorized capability scoped to this one object until it expires.
   *
   * @param path - The object key/path
   * @param expiresIn - Lifetime in seconds (default 3600 = 1h, max 604800 = 7d).
   *   Honored for private buckets; public buckets return their long-lived URL.
   */
  async createSignedUrl(path, expiresIn = 3600) {
    try {
      const strategy = await this.requestDownloadStrategy(path, expiresIn);
      return {
        data: {
          signedUrl: strategy.url,
          expiresAt: strategy.expiresAt ? new Date(strategy.expiresAt).toISOString() : null
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof InsForgeError ? error : new InsForgeError("Failed to create signed URL", 500, "STORAGE_ERROR")
      };
    }
  }
  /**
   * Create signed URLs for multiple objects in a single call.
   *
   * Each entry resolves independently: a failure on one key (not found / not
   * permitted) is reported on that entry's `error` without failing the rest.
   *
   * @param paths - The object keys/paths
   * @param expiresIn - Lifetime in seconds (default 3600 = 1h, max 604800 = 7d)
   */
  async createSignedUrls(paths, expiresIn = 3600) {
    try {
      const data = await Promise.all(
        paths.map(async (path) => {
          const { data: signed, error } = await this.createSignedUrl(path, expiresIn);
          return {
            path,
            signedUrl: signed?.signedUrl ?? null,
            error: error ? error.message : null
          };
        })
      );
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof InsForgeError ? error : new InsForgeError("Failed to create signed URLs", 500, "STORAGE_ERROR")
      };
    }
  }
  /**
   * List objects in the bucket
   * @param prefix - Filter by key prefix
   * @param search - Search in file names
   * @param limit - Maximum number of results (default: 100, max: 1000)
   * @param offset - Number of results to skip
   */
  async list(options) {
    try {
      const params = {};
      if (options?.prefix) {
        params.prefix = options.prefix;
      }
      if (options?.search) {
        params.search = options.search;
      }
      if (options?.limit) {
        params.limit = options.limit.toString();
      }
      if (options?.offset) {
        params.offset = options.offset.toString();
      }
      const response = await this.http.get(
        `/api/storage/buckets/${this.bucketName}/objects`,
        { params }
      );
      return { data: response, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof InsForgeError ? error : new InsForgeError("List failed", 500, "STORAGE_ERROR")
      };
    }
  }
  /**
   * Delete one or more files.
   *
   * A string uses the single-object endpoint. An array uses the batch endpoint,
   * which accepts at most 1000 keys and returns one result per key.
   *
   * @param pathOrPaths - One object key/path or an array of object keys/paths
   */
  async remove(pathOrPaths) {
    try {
      const response = Array.isArray(pathOrPaths) ? await this.http.delete(
        `/api/storage/buckets/${this.bucketName}/objects`,
        { body: { keys: pathOrPaths } }
      ) : await this.http.delete(
        `/api/storage/buckets/${this.bucketName}/objects/${encodeURIComponent(pathOrPaths)}`
      );
      return { data: response, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof InsForgeError ? error : new InsForgeError("Delete failed", 500, "STORAGE_ERROR")
      };
    }
  }
};
var Storage = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Get a bucket instance for operations
   * @param bucketName - Name of the bucket
   */
  from(bucketName) {
    return new StorageBucket(bucketName, this.http);
  }
};
var AI = class {
  constructor(http) {
    this.http = http;
    this.chat = new Chat(http);
    this.images = new Images(http);
    this.embeddings = new Embeddings(http);
  }
};
var Chat = class {
  constructor(http) {
    this.completions = new ChatCompletions(http);
  }
};
var ChatCompletions = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Create a chat completion - OpenAI-like response format
   *
   * @example
   * ```typescript
   * // Non-streaming
   * const completion = await client.ai.chat.completions.create({
   *   model: 'gpt-4',
   *   messages: [{ role: 'user', content: 'Hello!' }]
   * });
   * console.log(completion.choices[0].message.content);
   *
   * // With images (OpenAI-compatible format)
   * const response = await client.ai.chat.completions.create({
   *   model: 'gpt-4-vision',
   *   messages: [{
   *     role: 'user',
   *     content: [
   *       { type: 'text', text: 'What is in this image?' },
   *       { type: 'image_url', image_url: { url: 'https://example.com/image.jpg' } }
   *     ]
   *   }]
   * });
   *
   * // With PDF files
   * const pdfResponse = await client.ai.chat.completions.create({
   *   model: 'anthropic/claude-3.5-sonnet',
   *   messages: [{
   *     role: 'user',
   *     content: [
   *       { type: 'text', text: 'Summarize this document' },
   *       { type: 'file', file: { filename: 'doc.pdf', file_data: 'https://example.com/doc.pdf' } }
   *     ]
   *   }],
   *   fileParser: { enabled: true, pdf: { engine: 'mistral-ocr' } }
   * });
   *
   * // With web search
   * const searchResponse = await client.ai.chat.completions.create({
   *   model: 'openai/gpt-4',
   *   messages: [{ role: 'user', content: 'What are the latest news about AI?' }],
   *   webSearch: { enabled: true, maxResults: 5 }
   * });
   * // Access citations from response.choices[0].message.annotations
   *
   * // With thinking/reasoning mode (Anthropic models)
   * const thinkingResponse = await client.ai.chat.completions.create({
   *   model: 'anthropic/claude-3.5-sonnet',
   *   messages: [{ role: 'user', content: 'Solve this complex math problem...' }],
   *   thinking: true
   * });
   *
   * // Streaming - returns async iterable
   * const stream = await client.ai.chat.completions.create({
   *   model: 'gpt-4',
   *   messages: [{ role: 'user', content: 'Tell me a story' }],
   *   stream: true
   * });
   *
   * for await (const chunk of stream) {
   *   if (chunk.choices[0]?.delta?.content) {
   *     process.stdout.write(chunk.choices[0].delta.content);
   *   }
   * }
   * ```
   */
  async create(params) {
    const backendParams = {
      model: params.model,
      messages: params.messages,
      temperature: params.temperature,
      maxTokens: params.maxTokens,
      topP: params.topP,
      stream: params.stream,
      // New plugin options
      webSearch: params.webSearch,
      fileParser: params.fileParser,
      thinking: params.thinking,
      // Tool calling options
      tools: params.tools,
      toolChoice: params.toolChoice,
      parallelToolCalls: params.parallelToolCalls
    };
    if (params.stream) {
      const headers = this.http.getHeaders();
      headers["Content-Type"] = "application/json";
      const response2 = await this.http.fetch(`${this.http.baseUrl}/api/ai/chat/completion`, {
        method: "POST",
        headers,
        body: JSON.stringify(backendParams)
      });
      if (!response2.ok) {
        const error = await response2.json();
        throw new Error(error.error || "Stream request failed");
      }
      return this.parseSSEStream(response2, params.model);
    }
    const response = await this.http.post(
      "/api/ai/chat/completion",
      backendParams
    );
    const content = response.text || "";
    return {
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1e3),
      model: response.metadata?.model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content,
            // Include tool_calls if present (from tool calling)
            ...response.tool_calls?.length && { tool_calls: response.tool_calls },
            // Include annotations if present (from web search or file parsing)
            ...response.annotations?.length && { annotations: response.annotations }
          },
          finish_reason: response.tool_calls?.length ? "tool_calls" : "stop"
        }
      ],
      usage: response.metadata?.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
  }
  /**
   * Parse SSE stream into async iterable of OpenAI-like chunks
   */
  async *parseSSEStream(response, model) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { done, value: value2 } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value2, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr) {
              try {
                const data = JSON.parse(dataStr);
                if (data.chunk || data.content) {
                  yield {
                    id: `chatcmpl-${Date.now()}`,
                    object: "chat.completion.chunk",
                    created: Math.floor(Date.now() / 1e3),
                    model,
                    choices: [
                      {
                        index: 0,
                        delta: {
                          content: data.chunk || data.content
                        },
                        finish_reason: null
                      }
                    ]
                  };
                }
                if (data.tool_calls?.length) {
                  yield {
                    id: `chatcmpl-${Date.now()}`,
                    object: "chat.completion.chunk",
                    created: Math.floor(Date.now() / 1e3),
                    model,
                    choices: [
                      {
                        index: 0,
                        delta: {
                          tool_calls: data.tool_calls
                        },
                        finish_reason: "tool_calls"
                      }
                    ]
                  };
                }
                if (data.done) {
                  reader.releaseLock();
                  return;
                }
              } catch {
                console.warn("Failed to parse SSE data:", dataStr);
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
};
var Embeddings = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Create embeddings for text input - OpenAI-like response format
   *
   * @example
   * ```typescript
   * // Single text input
   * const response = await client.ai.embeddings.create({
   *   model: 'openai/text-embedding-3-small',
   *   input: 'Hello world'
   * });
   * console.log(response.data[0].embedding); // number[]
   *
   * // Multiple text inputs
   * const response = await client.ai.embeddings.create({
   *   model: 'openai/text-embedding-3-small',
   *   input: ['Hello world', 'Goodbye world']
   * });
   * response.data.forEach((item, i) => {
   *   console.log(`Embedding ${i}:`, item.embedding.slice(0, 5)); // First 5 dimensions
   * });
   *
   * // With custom dimensions (if supported by model)
   * const response = await client.ai.embeddings.create({
   *   model: 'openai/text-embedding-3-small',
   *   input: 'Hello world',
   *   dimensions: 256
   * });
   *
   * // With base64 encoding format
   * const response = await client.ai.embeddings.create({
   *   model: 'openai/text-embedding-3-small',
   *   input: 'Hello world',
   *   encoding_format: 'base64'
   * });
   * ```
   */
  async create(params) {
    const response = await this.http.post("/api/ai/embeddings", params);
    return {
      object: response.object,
      data: response.data,
      model: response.metadata?.model,
      usage: response.metadata?.usage ? {
        prompt_tokens: response.metadata.usage.promptTokens || 0,
        total_tokens: response.metadata.usage.totalTokens || 0
      } : {
        prompt_tokens: 0,
        total_tokens: 0
      }
    };
  }
};
var Images = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Generate images - OpenAI-like response format
   *
   * @example
   * ```typescript
   * // Text-to-image
   * const response = await client.ai.images.generate({
   *   model: 'dall-e-3',
   *   prompt: 'A sunset over mountains',
   * });
   * console.log(response.data[0].b64_json);
   *
   * // Image-to-image (with input images)
   * const response = await client.ai.images.generate({
   *   model: 'stable-diffusion-xl',
   *   prompt: 'Transform this into a watercolor painting',
   *   images: [
   *     { url: 'https://example.com/input.jpg' },
   *     // or base64-encoded Data URI:
   *     { url: 'data:image/jpeg;base64,/9j/4AAQ...' }
   *   ]
   * });
   * ```
   */
  async generate(params) {
    const response = await this.http.post(
      "/api/ai/image/generation",
      params
    );
    let data = [];
    if (response.images && response.images.length > 0) {
      data = response.images.map((img) => ({
        b64_json: img.imageUrl.replace(/^data:image\/\w+;base64,/, ""),
        content: response.text
      }));
    } else if (response.text) {
      data = [{ content: response.text }];
    }
    return {
      created: Math.floor(Date.now() / 1e3),
      data,
      ...response.metadata?.usage && {
        usage: {
          total_tokens: response.metadata.usage.totalTokens || 0,
          input_tokens: response.metadata.usage.promptTokens || 0,
          output_tokens: response.metadata.usage.completionTokens || 0
        }
      }
    };
  }
};
var Functions = class _Functions {
  constructor(http, functionsUrl) {
    this.http = http;
    this.functionsUrl = functionsUrl || _Functions.deriveSubhostingUrl(http.baseUrl);
  }
  /**
   * Derive the subhosting URL from the base URL.
   * Base URL pattern: https://{appKey}.{region}.insforge.app
   * Functions URL:    https://{appKey}.function2.insforge.app
   * Only applies to .insforge.app domains.
   */
  static deriveSubhostingUrl(baseUrl) {
    try {
      const { hostname } = new URL(baseUrl);
      if (!hostname.endsWith(".insforge.app")) {
        return void 0;
      }
      const appKey = hostname.split(".")[0];
      return `https://${appKey}.function2.insforge.app`;
    } catch {
      return void 0;
    }
  }
  /**
   * Build a Request for in-process dispatch. The host is a non-routable
   * placeholder; the router only reads pathname.
   */
  buildInProcessRequest(slug, method, body, callerHeaders) {
    const url2 = new URL("/" + slug, "http://insforge.local").toString();
    const headers = { ...this.http.getHeaders() };
    const reqBody = serializeBody(method, body, headers);
    Object.assign(headers, callerHeaders);
    return new Request(url2, {
      method,
      headers,
      body: reqBody
    });
  }
  /**
   * Invoke an Edge Function.
   *
   * Dispatch order:
   * 1. If `globalThis.__insforge_dispatch__` is present, call it in-process.
   *    This avoids Deno Subhosting's 508 Loop Detected when one bundled
   *    function invokes another inside the same deployment.
   * 2. Otherwise, try the configured subhosting URL.
   * 3. On 404 from subhosting, fall back to the proxy path.
   *
   * @param slug The function slug to invoke
   * @param options Request options
   */
  async invoke(slug, options = {}) {
    const { method = "POST", body, headers = {} } = options;
    const dispatch = globalThis.__insforge_dispatch__;
    const localFunctionsUrl = _Functions.deriveSubhostingUrl(this.http.baseUrl);
    if (typeof dispatch === "function" && !!localFunctionsUrl && this.functionsUrl === localFunctionsUrl) {
      try {
        const req = this.buildInProcessRequest(slug, method, body, headers);
        const res = await dispatch(req);
        const data = await parseResponse(res);
        return { data, error: null };
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw error;
        }
        return {
          data: null,
          error: error instanceof InsForgeError ? error : new InsForgeError(
            error instanceof Error ? error.message : "Function invocation failed",
            500,
            "FUNCTION_ERROR"
          )
        };
      }
    }
    if (this.functionsUrl) {
      try {
        const data = await this.http.request(method, `${this.functionsUrl}/${slug}`, {
          body,
          headers
        });
        return { data, error: null };
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw error;
        }
        if (error instanceof InsForgeError && error.statusCode === 404) {
        } else {
          return {
            data: null,
            error: error instanceof InsForgeError ? error : new InsForgeError(
              error instanceof Error ? error.message : "Function invocation failed",
              500,
              "FUNCTION_ERROR"
            )
          };
        }
      }
    }
    try {
      const path = `/functions/${slug}`;
      const data = await this.http.request(method, path, { body, headers });
      return { data, error: null };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
      return {
        data: null,
        error: error instanceof InsForgeError ? error : new InsForgeError(
          error instanceof Error ? error.message : "Function invocation failed",
          500,
          "FUNCTION_ERROR"
        )
      };
    }
  }
};
var CONNECT_TIMEOUT = 1e4;
var SUBSCRIBE_TIMEOUT = 1e4;
var Realtime = class {
  constructor(baseUrl, tokenManager, anonKey, getValidAccessToken = async () => tokenManager.getAccessToken()) {
    this.baseUrl = baseUrl;
    this.tokenManager = tokenManager;
    this.anonKey = anonKey;
    this.getValidAccessToken = getValidAccessToken;
    this.socket = null;
    this.connectPromise = null;
    this.connectionAttempt = null;
    this.nextConnectionAttemptId = 0;
    this.subscriptions = /* @__PURE__ */ new Map();
    this.eventListeners = /* @__PURE__ */ new Map();
    this.tokenManager.onAuthStateChange((event) => {
      if (event !== AuthChangeEvent.TOKEN_REFRESHED) {
        this.reconnectForAuthChange();
      }
    });
  }
  notifyListeners(event, payload) {
    for (const callback of this.eventListeners.get(event) ?? []) {
      try {
        callback(payload);
      } catch (error) {
        console.error(`Error in ${event} callback:`, error);
      }
    }
  }
  async getHandshakeToken() {
    return await this.getValidAccessToken() ?? this.anonKey ?? null;
  }
  connect() {
    if (this.socket?.connected) {
      return Promise.resolve();
    }
    if (this.connectPromise) {
      return this.connectPromise;
    }
    const attemptId = ++this.nextConnectionAttemptId;
    const connection = (async () => {
      const { io } = await Promise.resolve().then(() => (init_esm5(), esm_exports2));
      if (attemptId !== this.nextConnectionAttemptId) {
        throw new Error("Connection cancelled");
      }
      await new Promise((resolve, reject) => {
        const socket = io(this.baseUrl, {
          transports: ["websocket"],
          auth: (callback) => {
            void this.getHandshakeToken().then(
              (token) => callback(token ? { token } : {}),
              () => callback({})
            );
          }
        });
        this.socket = socket;
        let initialConnection = true;
        let timeoutId = null;
        const clearConnectTimeout = () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        };
        const dispose = () => {
          clearConnectTimeout();
          socket.off("connect", onConnect);
          socket.off("connect_error", onConnectError);
          socket.off("disconnect", onDisconnect);
          socket.off("realtime:error", onRealtimeError);
          socket.offAny(onAny);
          socket.disconnect();
          if (this.socket === socket) {
            this.socket = null;
          }
          if (this.connectionAttempt?.id === attemptId) {
            this.connectionAttempt = null;
          }
        };
        const fail = (error) => {
          if (!initialConnection) {
            return;
          }
          initialConnection = false;
          dispose();
          reject(error);
        };
        const onConnect = () => {
          if (this.socket !== socket) {
            return;
          }
          clearConnectTimeout();
          this.resubscribeChannels();
          this.notifyListeners("connect");
          if (initialConnection) {
            initialConnection = false;
            if (this.connectionAttempt?.id === attemptId) {
              this.connectionAttempt = null;
            }
            resolve();
          }
        };
        const onConnectError = (error) => {
          clearConnectTimeout();
          this.notifyListeners("connect_error", error);
          if (initialConnection) {
            fail(error);
          }
        };
        const onDisconnect = (reason) => {
          this.handleDisconnect(reason);
        };
        const onRealtimeError = (error) => {
          this.notifyListeners("error", error);
        };
        const onAny = (event, message) => {
          if (event === "realtime:error") {
            return;
          }
          this.applyPresenceEvent(event, message);
          this.notifyListeners(event, message);
        };
        this.connectionAttempt = { id: attemptId, socket, cancel: fail };
        socket.on("connect", onConnect);
        socket.on("connect_error", onConnectError);
        socket.on("disconnect", onDisconnect);
        socket.on("realtime:error", onRealtimeError);
        socket.onAny(onAny);
        timeoutId = setTimeout(
          () => fail(new Error(`Connection timeout after ${CONNECT_TIMEOUT}ms`)),
          CONNECT_TIMEOUT
        );
      });
    })();
    const trackedConnection = connection.finally(() => {
      if (this.connectPromise === trackedConnection) {
        this.connectPromise = null;
      }
    });
    this.connectPromise = trackedConnection;
    return trackedConnection;
  }
  disconnect() {
    this.nextConnectionAttemptId++;
    this.connectionAttempt?.cancel(new Error("Disconnected"));
    this.socket?.disconnect();
    this.socket = null;
    this.connectPromise = null;
    for (const subscription of this.subscriptions.values()) {
      this.settleSubscription(
        subscription,
        {
          ok: false,
          channel: subscription.channel,
          error: { code: "DISCONNECTED", message: "Disconnected" }
        },
        false
      );
    }
    this.subscriptions.clear();
  }
  reconnectForAuthChange() {
    for (const subscription of this.subscriptions.values()) {
      if (subscription.status === "rejected") {
        subscription.status = "pending";
      }
    }
    if (!this.socket) {
      return;
    }
    this.socket.disconnect();
    this.socket.connect();
  }
  handleDisconnect(reason) {
    for (const subscription of this.subscriptions.values()) {
      if (subscription.status === "rejected") {
        continue;
      }
      subscription.status = "pending";
      this.settleSubscription(
        subscription,
        {
          ok: false,
          channel: subscription.channel,
          error: { code: "DISCONNECTED", message: "Connection lost before subscription completed" }
        },
        true
      );
    }
    this.notifyListeners("disconnect", reason);
  }
  resubscribeChannels() {
    for (const [channel, subscription] of this.subscriptions) {
      if (subscription.status === "pending") {
        this.requestSubscription(channel, subscription);
      }
    }
  }
  requestSubscription(channel, subscription) {
    if (subscription.pending) {
      return subscription.pending;
    }
    const socket = this.socket;
    if (!socket?.connected) {
      return Promise.resolve({
        ok: false,
        channel,
        error: { code: "CONNECTION_FAILED", message: "Not connected to realtime server" }
      });
    }
    subscription.status = "pending";
    const epoch = ++subscription.epoch;
    let timeoutId;
    subscription.pending = new Promise((resolve) => {
      subscription.settlePending = (response) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        subscription.pending = void 0;
        subscription.settlePending = void 0;
        resolve(response);
      };
      timeoutId = setTimeout(() => {
        if (this.subscriptions.get(channel) === subscription && subscription.epoch === epoch) {
          this.settleSubscription(
            subscription,
            {
              ok: false,
              channel,
              error: {
                code: "SUBSCRIBE_TIMEOUT",
                message: "Subscription acknowledgement timed out"
              }
            },
            true
          );
        }
      }, SUBSCRIBE_TIMEOUT);
      socket.emit("realtime:subscribe", { channel }, (response) => {
        if (this.subscriptions.get(channel) !== subscription || subscription.epoch !== epoch) {
          return;
        }
        if (response.ok) {
          subscription.status = "subscribed";
          subscription.members = new Map(
            response.presence.members.map((member) => [member.presenceId, member])
          );
        } else {
          subscription.status = "rejected";
          subscription.members.clear();
        }
        this.settleSubscription(subscription, response, false);
      });
    });
    return subscription.pending;
  }
  settleSubscription(subscription, response, incrementEpoch) {
    if (incrementEpoch) {
      subscription.epoch++;
    }
    subscription.settlePending?.(response);
  }
  applyPresenceEvent(event, message) {
    if (event !== "presence:join" && event !== "presence:leave") {
      return;
    }
    const presenceEvent = message;
    const channel = presenceEvent.meta?.channel;
    const member = presenceEvent.member;
    if (!channel || !member) {
      return;
    }
    const subscription = this.subscriptions.get(channel);
    if (!subscription) {
      return;
    }
    if (event === "presence:join") {
      subscription.members.set(member.presenceId, member);
    } else {
      subscription.members.delete(member.presenceId);
    }
  }
  get isConnected() {
    return this.socket?.connected ?? false;
  }
  get connectionState() {
    if (!this.socket) {
      return "disconnected";
    }
    return this.socket.connected ? "connected" : "connecting";
  }
  get socketId() {
    return this.socket?.id;
  }
  async subscribe(channel) {
    let subscription = this.subscriptions.get(channel);
    if (subscription) {
      if (subscription.pending) {
        return subscription.pending;
      }
      if (subscription.status === "subscribed") {
        return { ok: true, channel, presence: { members: [...subscription.members.values()] } };
      }
    } else {
      subscription = { channel, epoch: 0, status: "pending", members: /* @__PURE__ */ new Map() };
      this.subscriptions.set(channel, subscription);
    }
    if (!this.socket?.connected) {
      try {
        await this.connect();
      } catch (error) {
        if (this.subscriptions.get(channel) === subscription) {
          this.subscriptions.delete(channel);
        }
        const message = error instanceof Error ? error.message : "Connection failed";
        return { ok: false, channel, error: { code: "CONNECTION_FAILED", message } };
      }
    }
    return subscription.pending ?? this.requestSubscription(channel, subscription);
  }
  unsubscribe(channel) {
    const subscription = this.subscriptions.get(channel);
    if (!subscription) {
      return;
    }
    this.subscriptions.delete(channel);
    this.settleSubscription(
      subscription,
      {
        ok: false,
        channel,
        error: { code: "SUBSCRIPTION_CANCELLED", message: "Subscription cancelled" }
      },
      true
    );
    if (this.socket?.connected) {
      this.socket.emit("realtime:unsubscribe", { channel });
    }
  }
  async publish(channel, event, payload) {
    if (!this.socket?.connected) {
      throw new Error("Not connected to realtime server. Call connect() first.");
    }
    this.socket.emit("realtime:publish", { channel, event, payload });
  }
  on(event, callback) {
    const listeners = this.eventListeners.get(event) ?? /* @__PURE__ */ new Set();
    listeners.add(callback);
    this.eventListeners.set(event, listeners);
  }
  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    listeners?.delete(callback);
    if (listeners?.size === 0) {
      this.eventListeners.delete(event);
    }
  }
  once(event, callback) {
    const wrapper = (payload) => {
      this.off(event, wrapper);
      callback(payload);
    };
    this.on(event, wrapper);
  }
  getSubscribedChannels() {
    return [...this.subscriptions.values()].filter((subscription) => subscription.status === "subscribed").map((subscription) => subscription.channel);
  }
  getPresenceState(channel) {
    return [...this.subscriptions.get(channel)?.members.values() ?? []];
  }
};
var Emails = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Send a custom HTML email
   * @param options Email options including recipients, subject, and HTML content
   */
  async send(options) {
    try {
      const data = await this.http.post("/api/email/send-raw", options);
      return { data, error: null };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
      return {
        data: null,
        error: error instanceof InsForgeError ? error : new InsForgeError(
          error instanceof Error ? error.message : "Email send failed",
          500,
          "EMAIL_ERROR"
        )
      };
    }
  }
};
function providerEnvironmentPath(provider, environment) {
  return `/api/payments/${provider}/${encodeURIComponent(environment)}`;
}
var StripePayments = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Create a Stripe Checkout Session through the InsForge backend.
   *
   * @example
   * ```typescript
   * const { data, error } = await client.payments.stripe.createCheckoutSession('test', {
   *   mode: 'payment',
   *   lineItems: [{ priceId: 'price_123', quantity: 1 }],
   *   successUrl: `${window.location.origin}/success`,
   *   cancelUrl: `${window.location.origin}/pricing`
   * });
   *
   * if (!error && data.checkoutSession.url) {
   *   window.location.assign(data.checkoutSession.url);
   * }
   * ```
   */
  async createCheckoutSession(environment, request) {
    try {
      const data = await this.http.post(
        `${providerEnvironmentPath("stripe", environment)}/checkout-sessions`,
        request,
        { idempotent: !!request.idempotencyKey }
      );
      return { data, error: null };
    } catch (error) {
      return wrapError(
        error,
        "Stripe checkout session creation failed"
      );
    }
  }
  /**
   * Create a Stripe Billing Portal Session for a mapped billing subject.
   */
  async createCustomerPortalSession(environment, request) {
    try {
      const data = await this.http.post(
        `${providerEnvironmentPath("stripe", environment)}/customer-portal-sessions`,
        request
      );
      return { data, error: null };
    } catch (error) {
      return wrapError(
        error,
        "Stripe customer portal session creation failed"
      );
    }
  }
};
var RazorpayPayments = class {
  constructor(http) {
    this.http = http;
  }
  async createOrder(environment, request) {
    try {
      const data = await this.http.post(
        `${providerEnvironmentPath("razorpay", environment)}/orders`,
        request
      );
      return { data, error: null };
    } catch (error) {
      return wrapError(error, "Razorpay order creation failed");
    }
  }
  async verifyOrder(environment, request) {
    try {
      const data = await this.http.post(
        `${providerEnvironmentPath("razorpay", environment)}/orders/verify`,
        request
      );
      return { data, error: null };
    } catch (error) {
      return wrapError(error, "Razorpay order verification failed");
    }
  }
  async createSubscription(environment, request) {
    try {
      const data = await this.http.post(
        `${providerEnvironmentPath("razorpay", environment)}/subscriptions`,
        request
      );
      return { data, error: null };
    } catch (error) {
      return wrapError(
        error,
        "Razorpay subscription creation failed"
      );
    }
  }
  async verifySubscription(environment, request) {
    try {
      const data = await this.http.post(
        `${providerEnvironmentPath("razorpay", environment)}/subscriptions/verify`,
        request
      );
      return { data, error: null };
    } catch (error) {
      return wrapError(
        error,
        "Razorpay subscription verification failed"
      );
    }
  }
  async cancelSubscription(environment, subscriptionId, request = {}) {
    try {
      const data = await this.http.post(
        `${providerEnvironmentPath("razorpay", environment)}/subscriptions/${encodeURIComponent(
          subscriptionId
        )}/cancel`,
        request
      );
      return { data, error: null };
    } catch (error) {
      return wrapError(
        error,
        "Razorpay subscription cancellation failed"
      );
    }
  }
  async pauseSubscription(environment, subscriptionId) {
    try {
      const data = await this.http.post(
        `${providerEnvironmentPath("razorpay", environment)}/subscriptions/${encodeURIComponent(
          subscriptionId
        )}/pause`,
        {}
      );
      return { data, error: null };
    } catch (error) {
      return wrapError(
        error,
        "Razorpay subscription pause failed"
      );
    }
  }
  async resumeSubscription(environment, subscriptionId) {
    try {
      const data = await this.http.post(
        `${providerEnvironmentPath("razorpay", environment)}/subscriptions/${encodeURIComponent(
          subscriptionId
        )}/resume`,
        {}
      );
      return { data, error: null };
    } catch (error) {
      return wrapError(
        error,
        "Razorpay subscription resume failed"
      );
    }
  }
};
var Payments = class {
  constructor(http) {
    this.stripe = new StripePayments(http);
    this.razorpay = new RazorpayPayments(http);
  }
};
var InsForgeClient = class {
  constructor(config = {}) {
    const logger = new Logger(config.debug);
    this.tokenManager = new TokenManager();
    this.http = new HttpClient(config, this.tokenManager, logger);
    const accessToken = config.accessToken ?? config.edgeFunctionToken;
    if (accessToken) {
      this.http.setAuthToken(accessToken);
      this.tokenManager.setAccessToken(accessToken);
    }
    this.auth = new Auth(this.http, this.tokenManager, {
      isServerMode: config.isServerMode ?? !!accessToken,
      detectOAuthCallback: config.auth?.detectOAuthCallback
    });
    this.database = new Database(this.http, config.db?.schema);
    this.storage = new Storage(this.http);
    this.ai = new AI(this.http);
    this.functions = new Functions(this.http, config.functionsUrl);
    this.realtime = new Realtime(
      this.http.baseUrl,
      this.tokenManager,
      config.anonKey,
      () => this.http.getValidAccessToken()
    );
    this.emails = new Emails(this.http);
    this.payments = new Payments(this.http);
  }
  /**
   * Get the underlying HTTP client for custom requests
   *
   * @example
   * ```typescript
   * const httpClient = client.getHttpClient();
   * const customData = await httpClient.get('/api/custom-endpoint');
   * ```
   */
  getHttpClient() {
    return this.http;
  }
  /**
   * Set the access token used by every SDK surface. Updates both the HTTP
   * client (database / storage / functions / AI / emails) and the realtime
   * token manager. Pass `null` to sign out. By default a token replacement is
   * treated as a sign-in boundary and reconnects realtime. Pass
   * `AuthChangeEvent.TOKEN_REFRESHED` for a same-identity refresh to preserve a live socket; the
   * refreshed token is then used at the next handshake.
   *
   * Use this when an external auth provider (Better Auth, Clerk, Auth0,
   * WorkOS, Kinde, Stytch, …) issues the JWT and you need to keep the
   * long-lived InsForge client in sync. Without this, you'd have to call
   * `client.getHttpClient().setAuthToken(token)` AND reach into the private
   * realtime token manager separately.
   *
   * @example
   * ```typescript
   * import { AuthChangeEvent } from '@insforge/sdk';
   *
   * // Refresh a third-party-issued JWT periodically
   * const { token } = await fetch('/api/insforge-token').then((r) => r.json());
   * client.setAccessToken(token, AuthChangeEvent.TOKEN_REFRESHED);
   *
   * // Sign-out
   * client.setAccessToken(null);
   * ```
   */
  setAccessToken(token, event = AuthChangeEvent.SIGNED_IN) {
    this.http.setAuthToken(token);
    if (token === null) {
      this.tokenManager.clearSession();
    } else {
      this.tokenManager.setAccessToken(token, event);
    }
  }
  /**
   * Future modules will be added here:
   * - database: Database operations
   * - storage: File storage operations
   * - functions: Serverless functions
   * - tables: Table management
   * - metadata: Backend metadata
   */
};
function createClient(config = {}) {
  return new InsForgeClient(config);
}
function createAdminClient(config) {
  const { apiKey: rawApiKey, ...clientConfig } = config ?? {};
  const apiKey = rawApiKey?.trim();
  if (!apiKey) {
    throw new Error("Missing apiKey. Pass apiKey to createAdminClient().");
  }
  return new InsForgeClient({
    ...clientConfig,
    accessToken: apiKey,
    isServerMode: true
  });
}
var src_default = InsForgeClient;
export {
  AI,
  Auth,
  AuthChangeEvent,
  Database,
  Emails,
  Functions,
  HttpClient,
  InsForgeClient,
  InsForgeError,
  Logger,
  Payments,
  Realtime,
  Storage,
  StorageBucket,
  createAdminClient,
  createClient,
  src_default as default
};

import querystring from "query-string";
import { dataProvider } from "./provider";

export default dataProvider;

export * from "./utils";

const stringify = querystring.stringify

export { stringify };

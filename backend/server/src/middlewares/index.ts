import cors from "cors";
import bodyParser from "body-parser";
import authentication from "./authentication";

const middlewares = [
  cors(),
  bodyParser.urlencoded({ extended: false }),
  authentication,
];

export default middlewares;

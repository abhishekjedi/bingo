import cors from "cors";
import bodyParser from "body-parser";

const middlewares = [cors(), bodyParser.urlencoded({ extended: false })];

export default middlewares;

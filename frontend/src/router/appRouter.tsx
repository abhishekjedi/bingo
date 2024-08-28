import { RouterProvider } from "react-router-dom";
import router from "./appRoutes";

function AppRouter(){
    return (
        <RouterProvider router={router}/>
    );
}

export default AppRouter;
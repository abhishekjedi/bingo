import HttpClientInstance from "../../config/httpclient";

export function guestLogin() {
  return HttpClientInstance.get({
    url: "/login/guest",
  });
}

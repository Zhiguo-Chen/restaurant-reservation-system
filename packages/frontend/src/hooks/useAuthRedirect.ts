import { useNavigate } from "@solidjs/router";

export const useAuthRedirect = () => {
  const navigate = useNavigate();

  const redirectAfterLogin = () => {
    const redirectPath = sessionStorage.getItem("redirectAfterLogin");
    if (redirectPath) {
      sessionStorage.removeItem("redirectAfterLogin");
      navigate(redirectPath);
    } else {
      navigate("/employee");
    }
  };

  const setRedirectPath = (path: string) => {
    sessionStorage.setItem("redirectAfterLogin", path);
  };

  const clearRedirectPath = () => {
    sessionStorage.removeItem("redirectAfterLogin");
  };

  return {
    redirectAfterLogin,
    setRedirectPath,
    clearRedirectPath,
  };
};

/* /lib/auth.js */

import { useEffect } from "react";
import Router from "next/router";
import Cookie from "js-cookie";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";

//https://stackoverflow.com/questions/53019539/axios-cannot-send-cookie-with-request-even-with-withcredential-true
/* const app = axios.create({
  API_URL,
  withCredentials: true
})

app.interceptors.response.use(
  response => (response), 
  error => (Promise.reject(error.response.data.err))
) 
export default app;
*/
// end https://stackoverflow.com/questions/53019539/axios-cannot-send-cookie-with-request-even-with-withcredential-true

//axios.defaults.withCredentials = true;


//register a new user
export const registerUser = (username, email, password) => {
  //prevent function from being ran on the server
  if (typeof window === "undefined") {
    return;
  }
  return new Promise((resolve, reject) => {
    axios
      .post(`${API_URL}/auth/local/register`, { username, email, password, sameSite: 'none', secure: true   })
      .then((res) => {
        //set token response from Strapi for server validation
        Cookie.set("token", res.data.jwt, { withCredentials: true, sameSite: 'none', secure: true });

        //resolve the promise to set loading to false in SignUp form
        resolve(res);
        //redirect back to home page for restaurance selection
        Router.push("/");
      })
      .catch((error) => {
        //reject the promise and pass the error object back to the form
        reject(error);
      });
  });
};

export const login = (identifier, password) => {
  //prevent function from being ran on the server
  if (typeof window === "undefined") {
    return;
  }

  /* return new Promise((resolve, reject) => {
    axios
      
    .post(`${API_URL}/auth/local/`, { identifier, password, sameSite: 'none', secure: true   })
      .then((res) => {
        //set token response from Strapi for server validation
        Cookie.set("token", res.data.jwt, { sameSite: 'none', secure: true });

        //resolve the promise to set loading to false in SignUp form
        resolve(res);
        //redirect back to home page for restaurance selection
        Router.push("/");
      })
      .catch((error) => {
        //reject the promise and pass the error object back to the form
        reject(error);
      });
  }); */

  async function login(username, password) {
    try {
      const response = await axios.post('http://localhost:1337/auth/local', {
        identifier: username,
        password,
      });
      const { data } = response;
      setUser(data.user);
      localStorage.setItem('token', data.jwt);
  
      // Set SameSite attribute for token cookie
      document.cookie = `token=${data.jwt}; SameSite=None; Secure`;
    } catch (error) {
      console.error(error);
    }
  }
};

export const logout = () => {
  //remove token and user cookie
  Cookie.remove("token", { withCredentials: true, sameSite: 'none', secure: true });
  delete window.__user;
  // sync logout between multiple windows
  window.localStorage.setItem("logout", Date.now());
  //redirect to the home page
  Router.push("/");
};

//Higher Order Component to wrap our pages and logout simultaneously logged in tabs
// THIS IS NOT USED in the tutorial, only provided if you wanted to implement
export const withAuthSync = (Component) => {
  const Wrapper = (props) => {
    const syncLogout = (event) => {
      if (event.key === "logout") {
        Router.push("/login");
      }
    };

    useEffect(() => {
      window.addEventListener("storage", syncLogout);

      return () => {
        window.removeEventListener("storage", syncLogout);
        window.localStorage.removeItem("logout");
      };
    }, []);

    return <Component {...props} />;
  };

  if (Component.getInitialProps) {
    Wrapper.getInitialProps = Component.getInitialProps;
  }

  return Wrapper;
};

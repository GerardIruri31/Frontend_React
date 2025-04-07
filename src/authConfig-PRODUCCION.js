/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { LogLevel } from "@azure/msal-browser";

/**
 * Enter here the user flows and custom policies for your B2C application
 * To learn more about user flows, visit: https://docs.microsoft.com/en-us/azure/active-directory-b2c/user-flow-overview
 * To learn more about custom policies, visit: https://docs.microsoft.com/en-us/azure/active-directory-b2c/custom-policy-overview
 */
export const b2cPolicies = {
  // nombres de los servicios
  names: {
    signUpSignIn: "B2C_1_SingUp_SingIn",
    forgotPassword: "B2C_1_reset",
    editProfile: "B2C_1_edit_profile",
  },
  // URL de los servicios
  authorities: {
    signUpSignIn: {
      authority:
        "https://autopubli.b2clogin.com/autopubli.onmicrosoft.com/B2C_1_SingUp_SingIn",
    },
    forgotPassword: {
      authority:
        "https://autopubli.b2clogin.com/autopubli.onmicrosoft.com/B2C_1_reset",
    },
    editProfile: {
      authority:
        "https://autopubli.b2clogin.com/autopubli.onmicrosoft.com/B2C_1_edit_profile",
    },
  },
  // URI general del servicio
  authorityDomain: "autopubli.b2clogin.com",
};

/**
 * Configuration object to be passed to MSAL instance on creation.
 * For a full list of MSAL.js configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md
 */
export const msalConfig = {
  //
  auth: {
    // ID de tu app registrada en Azure B2C
    clientId: "14b06491-66d5-4157-b6d6-1cc8a5e09517", // This is the ONLY mandatory field that you need to supply.
    authority: b2cPolicies.authorities.signUpSignIn.authority, // Choose SUSI as your default authority.
    knownAuthorities: [b2cPolicies.authorityDomain], // Mark your B2C tenant's domain as trusted.
    // a dónde vuelve luego del login
    redirectUri: "https://cont-app-frontend.bluewave-a9df1497.centralus.azurecontainerapps.io", // You must register this URI on Azure Portal/App Registration. Defaults to window.location.origin
    // a dónde vuelve luego del logout
    postLogoutRedirectUri: "https://cont-app-frontend.bluewave-a9df1497.centralus.azurecontainerapps.io", // Indicates the page to navigate after logout.
    navigateToLoginRequestUrl: false, // If "true", will navigate back to the original request location before processing the auth code response.
  },
  cache: {
    // dónde guarda el token (más seguro que localStorage)
    cacheLocation: "sessionStorage", // Configures cache location. "sessionStorage" is more secure, but "localStorage" gives you SSO between tabs.
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
  // Permite ver los logs de la authorization
  system: {
    loggerOptions: {
      // containsPii: información sensible
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      },
    },
  },
};

/**
 * Scopes you add here will be prompted for user consent during sign-in.
 * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
 * For more information about OIDC scopes, visit:
 * https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
 */
export const loginRequest = {
  scopes: ["openid", "profile", "email"],
  //prompt: "login", // 👈 fuerza a pedir credenciales siempre
};

/**
 * An optional silentRequest object can be used to achieve silent SSO
 * between applications by providing a "login_hint" property.
 */

// Permite hacer login en segundo plano (silent SSO) si el usuario ya está logueado en otra app o sesión.

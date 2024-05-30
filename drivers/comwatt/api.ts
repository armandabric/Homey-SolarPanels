import { SiteSummary, SummaryResponse, SystemsResponse } from "./types";
import jsSHA from "jssha";
import cookie from "cookie";
import type { SimpleClass } from "homey";

const _importDynamic = new Function("modulePath", "return import(modulePath)");

async function fetch(...args: [string, RequestInit]): Promise<Response> {
  const { default: fetch } = await _importDynamic("node-fetch");
  return fetch(...args);
}

export function obfuscatePassword(e: string): string {
  var t = new jsSHA("SHA-256", "TEXT");

  return t.update("jbjaonfusor_".concat(e, "_4acuttbuik9")), t.getHash("HEX");
}

const apiEndpoint = "https://energy.comwatt.com";

export class ComwattApi {
  constructor(private logger: SimpleClass) {}

  public async login(
    username: string,
    password: string
  ): Promise<ComwattDeviceApi> {
    const credentials = {
      username,
      password: obfuscatePassword(password),
    };

    this.logger.log("[ComwattApi] `POST /v1/authent` credentials", credentials);

    const response = await fetch(`${apiEndpoint}/api/v1/authent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      this.logger.error("[ComwattApi] ", response);

      if (response.status === 401) {
        throw new Error(
          "Your Comwatt credentials are incorrect, please try again."
        );
      } else {
        throw new Error(
          "An unknown error occurred while fetching inverter data."
        );
      }
    }

    const rawSetCookies = response.headers.get("set-cookie");

    if (!rawSetCookies) {
      throw new Error("Invalid response: could not extract the 'set-cookie'");
    } else if (Array.isArray(rawSetCookies)) {
      throw new Error("Invalid response: multiple 'set-cookie'");
    }

    const setCookies = cookie.parse(rawSetCookies);

    const token = setCookies["cwt_session"];
    if (!token) {
      throw new Error(
        "Invalid response: could not find the 'cwt_session' cookie"
      );
    }

    return new ComwattDeviceApi(this.logger, token);
  }
}

export class ComwattDeviceApi {
  constructor(private logger: SimpleClass, private token: string) {}

  private async getApiEndpoint<T = unknown>(path: string): Promise<T> {
    const response = await fetch(`${apiEndpoint}${path}`, {
      headers: {
        Cookie: `cwt_session=${this.token}`,
        "Content-Type": "application/json",
      },
    });

    // Handle possible errors
    if (!response.ok) {
      this.logger.error(
        "[ComwattDeviceApi.getApiEndpoint] Request error",
        response
      );

      if (response.status === 401) {
        throw new Error(
          "Your Comwatt credentials are incorrect, please try again."
        );
      } else {
        throw new Error(
          "An unknown error occurred while fetching inverter data."
        );
      }
    }

    const payload = await response.json();

    this.logger.log("[ComwattDeviceApi.getApiEndpoint] payload", payload);

    return payload as T;
  }

  getSites = async (): Promise<Array<SiteSummary>> => {
    const payload = await this.getApiEndpoint<
      Array<{ siteUid: string; name: string }>
    >(`/api/sites`);

    this.logger.log("[ComwattDeviceApi.getSites] payload", payload);

    return payload.map((oneSitePayload) => {
      return {
        siteUid: oneSitePayload.siteUid,
        name: oneSitePayload.name,
      };
    });
  };
}

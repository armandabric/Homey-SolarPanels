import { Device, Driver } from "homey";
import PairSession from "homey/lib/PairSession";

import { ComwattApi, ComwattDeviceApi } from "./api";
import { DeviceData, DeviceSettings } from "./types";

class ComwattDriver extends Driver {
  async onPair(session: PairSession) {
    this.homey.log("[ComwattDriver.onPair] start");

    let username = "";
    let password = "";
    let deviceApi: ComwattDeviceApi;

    session.setHandler("login", async (data) => {
      this.homey.log("[ComwattDriver.onPair][session.setHandler] start");

      username = data.username;
      password = data.password;

      this.homey.log("[ComwattDriver.onPair][session.setHandler]", { data });

      deviceApi = await new ComwattApi(this.homey).login(username, password);

      this.homey.log("[deviceApi]", deviceApi);

      this.homey.log("[ComwattDriver.onPair][session.setHandler] end");

      return true;
    });

    session.setHandler("list_devices", async () => {
      const sites = await deviceApi.getSites();

      this.homey.log(
        "[ComwattDriver.onPair][session.list_devices] sites",
        sites
      );

      const devices = sites.map((oneSite) => {
        return {
          name: oneSite.name,
          data: {
            siteUid: oneSite.siteUid,
          } satisfies DeviceData,
          settings: {
            username,
            password,
          } satisfies DeviceSettings,
        };
      });

      this.homey.log(
        "[ComwattDriver.onPair][session.list_devices] devices",
        devices
      );

      return devices;
    });

    this.homey.log("[ComwattDriver.onPair] end");
  }
}

module.exports = ComwattDriver;

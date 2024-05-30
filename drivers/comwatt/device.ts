import { Inverter } from "../../inverter";
import { ComwattApi, ComwattDeviceApi } from "./api";
import { DeviceData, DeviceSettings } from "./types";

class ComwattDevice extends Inverter {
  interval = 5;
  deviceApi?: ComwattDeviceApi;

  async onInit() {
    this.homey.log("[ComwattDevice.onInit] start");

    const data: DeviceData = this.getData();
    const settings: DeviceSettings = this.getSettings();

    this.deviceApi = await new ComwattApi(this.homey).login(
      settings.username,
      settings.password
    );

    this.homey.log("[onInit] before super");

    super.onInit();

    this.homey.log("[onInit] end");
  }

  async onSettings({
    newSettings,
    changedKeys,
  }: {
    newSettings: object;
    changedKeys: string[];
  }) {
    this.homey.log("[ComwattDevice.onSettings] start");

    // TODO: fix typing once Athom fixes their TypeScript implementation
    const typedNewSettings = newSettings as DeviceSettings;

    if (changedKeys.includes("username") || changedKeys.includes("password")) {
      this.homey.log("[ComwattDevice.onSettings] settings changed");

      const data: DeviceData = this.getData();

      const newDeviceApi = await new ComwattApi(this.homey).login(
        typedNewSettings.username,
        typedNewSettings.password
      );

      this.deviceApi = newDeviceApi;

      // Force production check when API key is changed
      this.checkProduction();
    }

    this.homey.log("[ComwattDevice.onSettings] end");
  }

  async checkProduction(): Promise<void> {
    this.homey.log("Checking production");

    // TODO: To be reactivated
    // if (this.api) {
    //   try {
    //     const systemSummary = await this.api.getSummary();

    //     const currentEnergy =
    //       Number(systemSummary.summary.daily_energy_dc) / 1000;
    //     this.setCapabilityValue("meter_power", currentEnergy);

    //     const currentPower = Number(systemSummary.summary.last_power_dc);
    //     this.setCapabilityValue("measure_power", currentPower);

    //     this.homey.log(`Current energy is ${currentEnergy}kWh`);
    //     this.homey.log(`Current power is ${currentPower}W`);

    //     await this.setAvailable();
    //   } catch (err) {
    //     const errorMessage = (err as Error).message;

    //     this.homey.log(`Unavailable: ${errorMessage}`);
    //     await this.setUnavailable(errorMessage);
    //   }
    // } else {
    //   await this.setUnavailable("Comwatt API connection not initialized");
    // }
  }
}

module.exports = ComwattDevice;

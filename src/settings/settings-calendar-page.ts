import { CalendarConfig, CalndarSectionBase, SectionName } from "../contracts/config.types";
import { App, Setting } from "obsidian";
import { SettingsBaseCalendarSection } from "./settings-base-calendar-section";
import { SettingsCalendarWeeklySection } from "./settings-calendar-weekly-section";
import { FolderSuggestion } from "./ui/folder-suggestion";
import { SettingsWidget } from "./settings-widget";

export class SettingsCalendarPage extends SettingsWidget {
  private sections: SettingsBaseCalendarSection<CalndarSectionBase>[] = [];

  constructor(
    app: App,
    private containerEl: HTMLElement,
    private config: CalendarConfig,
  ) {
    super(app);
  }

  get headerText(): string {
    return `Configuring ${this.config.name}`;
  }

  display(): void {
    const { containerEl } = this;

    const heading = new Setting(containerEl)
      .setName(this.headerText)
      .setHeading()
      .addButton((button) => {
        button.setButtonText("Back to list").onClick(() => {
          this.navigate({ type: "home" });
        });
      });

    const badge = heading.nameEl.createEl("span");
    badge.innerText = `ID: ${this.config.id}`;
    badge.classList.add("flair");

    new Setting(containerEl).setName("Journal Name").addText((text) => {
      text.setValue(this.config.name).onChange(() => {
        this.config.name = text.getValue();
        heading.setName(this.headerText);
        this.save();
      });
    });

    new Setting(containerEl).setName("Root Folder").addText((text) => {
      new FolderSuggestion(this.app, text.inputEl);
      text
        .setValue(this.config.rootFolder)
        .setPlaceholder("Example: folder 1/folder 2")
        .onChange(() => {
          this.config.rootFolder = text.getValue();
          this.updateFolderSuggestions();
          this.save();
        });
    });
    if (this.config.isDefault) {
      const startUp = new Setting(containerEl).setName("Open on Startup").addToggle((toggle) => {
        toggle.setValue(this.config.openOnStartup).onChange(() => {
          this.config.openOnStartup = toggle.getValue();
          this.save(true);
        });
      });
      if (this.config.openOnStartup) {
        startUp.addDropdown((dropdown) => {
          const avaliable: SectionName[] = [];
          if (this.config.daily.enabled) {
            dropdown.addOption("daily", "Daily Note");
            avaliable.push("daily");
          }
          if (this.config.weekly.enabled) {
            dropdown.addOption("weekly", "Weekly Note");
            avaliable.push("weekly");
          }
          if (this.config.monthly.enabled) {
            dropdown.addOption("monthly", "Monthly Note");
            avaliable.push("monthly");
          }
          if (this.config.quarterly.enabled) {
            dropdown.addOption("quarterly", "Quarterly Note");
            avaliable.push("quarterly");
          }
          if (this.config.yearly.enabled) {
            dropdown.addOption("yearly", "Yearly Note");
            avaliable.push("yearly");
          }
          if (!avaliable.contains(this.config.startupSection)) {
            this.config.startupSection = avaliable[0];
          }
          dropdown.setValue(this.config.startupSection).onChange((value) => {
            this.config.startupSection = value as CalendarConfig["startupSection"];
            this.save();
          });
        });
      }
    }

    this.registerSection(
      new SettingsBaseCalendarSection(this.app, this.config, containerEl, this.config.daily, "Daily"),
    );
    this.registerSection(
      new SettingsCalendarWeeklySection(this.app, this.config, containerEl, this.config.weekly, "Weekly"),
    );
    this.registerSection(
      new SettingsBaseCalendarSection(this.app, this.config, containerEl, this.config.monthly, "Monthly"),
    );
    this.registerSection(
      new SettingsBaseCalendarSection(this.app, this.config, containerEl, this.config.quarterly, "Quarterly"),
    );
    this.registerSection(
      new SettingsBaseCalendarSection(this.app, this.config, containerEl, this.config.yearly, "Yearly"),
    );
  }

  registerSection(section: SettingsBaseCalendarSection<CalndarSectionBase>): void {
    this.sections.push(section);
    section.display();
  }

  private updateFolderSuggestions() {
    for (const section of this.sections) {
      section.updateFolderSuggestions(this.config.rootFolder);
    }
  }
}

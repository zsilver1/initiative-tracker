import {
    debounce,
    ExtraButtonComponent,
    ItemView,
    Notice,
    WorkspaceLeaf
} from "obsidian";
import {
    BASE,
    CREATURE,
    CREATURE_TRACKER_VIEW,
    INTIATIVE_TRACKER_VIEW
} from "../utils";

import type InitiativeTracker from "../main";

import App from "./ui/App.svelte";
import type { Creature } from "../utils/creature";
import type {
    Condition,
    HomebrewCreature,
    InitiativeViewState,
    Party,
    TrackerEvents,
    UpdateLogMessage
} from "@types";
import { equivalent } from "../encounter";
import { OVERFLOW_TYPE, PLAYER_VIEW_VIEW } from "../utils/constants";
import type PlayerView from "./player-view";
import Logger from "../logger/logger";

export default class TrackerView extends ItemView {
    ui: App;

    constructor(public leaf: WorkspaceLeaf, public plugin: InitiativeTracker) {
        super(leaf);
        if (this.plugin.data.state?.creatures?.length) {
        } else {
        }
    }
    async onOpen() {
        this.ui = new App({
            target: this.contentEl,
            props: {
                plugin: this.plugin
            }
        });
        this.ui.$on("player-view", () => this.openPlayerView());
        this.ui.$on("open-map", () => this.openInitiativeView());
    }
    getViewType() {
        return INTIATIVE_TRACKER_VIEW;
    }
    getDisplayText() {
        return "Initiative Tracker";
    }
    getIcon() {
        return BASE;
    }

    //legacy Leaflet support...
    get pcs(): Creature[] {
        return [];
    }
    get npcs(): Creature[] {
        return [];
    }
    openInitiativeView() {
        this.plugin.leaflet.openInitiativeView(this.pcs, this.npcs);
    }

    //open player view
    playerViewOpened = false;
    getExistingPlayerView(): PlayerView | undefined {
        const existing =
            this.plugin.app.workspace.getLeavesOfType(PLAYER_VIEW_VIEW);
        if (existing.length) {
            return existing[0].view as PlayerView;
        }
    }
    async getPlayerView(): Promise<PlayerView> {
        const existing = this.getExistingPlayerView();
        if (existing) return existing;
        const leaf = await this.app.workspace.openPopoutLeaf();
        await leaf.setViewState({
            type: PLAYER_VIEW_VIEW
        });
        return leaf.view as PlayerView;
    }
    async openPlayerView() {
        await this.getPlayerView();
        this.playerViewOpened = true;
    }
}

export class CreatureView extends ItemView {
    buttonEl = this.contentEl.createDiv("creature-view-button");
    statblockEl = this.contentEl.createDiv("creature-statblock-container");
    constructor(leaf: WorkspaceLeaf, public plugin: InitiativeTracker) {
        super(leaf);
        this.load();
        this.containerEl.addClass("creature-view-container");
        this.containerEl.on(
            "mouseover",
            "a.internal-link",
            debounce(
                (ev) =>
                    app.workspace.trigger(
                        "link-hover",
                        {}, //hover popover, but don't need
                        ev.target, //targetEl
                        (ev.target as HTMLAnchorElement).dataset.href, //linkText
                        "initiative-tracker " //source
                    ),
                10
            )
        );
        this.containerEl.on("click", "a.internal-link", (ev) =>
            app.workspace.openLinkText(
                (ev.target as HTMLAnchorElement).dataset.href,
                "initiative-tracker"
            )
        );
    }
    onload() {
        new ExtraButtonComponent(this.buttonEl)
            .setIcon("cross")
            .setTooltip("Close Statblock")
            .onClick(() => {
                this.render();
                this.app.workspace.trigger("initiative-tracker:stop-viewing");
            });
    }
    onunload(): void {
        this.app.workspace.trigger("initiative-tracker:stop-viewing");
    }
    render(creature?: HomebrewCreature) {
        this.statblockEl.empty();
        if (!creature) {
            this.statblockEl.createEl("em", {
                text: "Select a creature to view it here."
            });
            return;
        }

        if (
            this.plugin.canUseStatBlocks &&
            this.plugin.statblockVersion?.major >= 2
        ) {
            const statblock = this.plugin.statblocks.render(
                creature,
                this.statblockEl,
                creature.display
            );
            this.addChild(statblock);
        } else {
            this.statblockEl.createEl("em", {
                text: "Install the TTRPG Statblocks plugin to use this feature!"
            });
        }
    }
    getDisplayText(): string {
        return "Combatant";
    }
    getIcon(): string {
        return CREATURE;
    }
    getViewType(): string {
        return CREATURE_TRACKER_VIEW;
    }
}

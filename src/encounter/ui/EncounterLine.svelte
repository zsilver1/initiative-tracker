<script lang="ts">
    import { ExtraButtonComponent } from "obsidian";

    import type InitiativeTracker from "src/main";
    import { tracker } from "src/tracker/stores/tracker";
    import { START_ENCOUNTER } from "src/utils";
    import { Creature } from "src/utils/creature";

    import type { StackRoller } from "../../../../obsidian-dice-roller/src/roller";

    export let creatures: Map<Creature, number | string>;

    export let plugin: InitiativeTracker;

    const creatureMap: Map<Creature, number> = new Map();
    const rollerMap: Map<Creature, StackRoller> = new Map();

    for (let [creature, count] of creatures) {
        let number: number = Number(count);
        if (plugin.canUseDiceRoller) {
            let roller = plugin.getRoller(`${count}`) as StackRoller;
            roller.on("new-result", () => {
                creatureMap.set(creature, roller.result);
            });
            rollerMap.set(creature, roller);
            roller.roll();
        } else {
            creatureMap.set(creature, number);
        }
    }

    const openButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon(START_ENCOUNTER);
    };
    const open = async () => {
        if (!plugin.view) {
            await plugin.addTrackerView();
        }

        const view = plugin.view;
        const creatures: Creature[] = [...creatureMap]
            .map(([creature, number]) => {
                if (isNaN(Number(number)) || number < 1) return [creature];
                return [...Array(number).keys()].map((v) =>
                    Creature.new(creature)
                );
            })
            .flat();

        tracker.new(plugin, {
            creatures: creatures.map((c) => c.toJSON()),
            name: null,
            state: false,
            round: 1,
            logFile: null,
            roll: true
        });
        plugin.app.workspace.revealLeaf(view.leaf);
    };

    const addButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("plus-with-circle");
    };

    const add = async (evt: MouseEvent) => {
        if (!plugin.view) {
            await plugin.addTrackerView();
        }
        const creatures: Creature[] = [...creatureMap]
            .map(([creature, number]) => {
                if (isNaN(Number(number)) || number < 1) return [creature];
                return [...Array(number).keys()].map((v) =>
                    Creature.new(creature)
                );
            })
            .flat();
        tracker.add(...creatures);
    };

    const rollerEl = (node: HTMLElement, creature: Creature) => {
        if (
            plugin.canUseDiceRoller &&
            rollerMap.has(creature) &&
            !rollerMap.get(creature)!.isStatic
        ) {
            node.appendChild(
                rollerMap.get(creature)?.containerEl ??
                    createSpan({ text: `${creatureMap.get(creature)}` })
            );
        } else {
            node.setText(`${creatureMap.get(creature)}`);
        }
    };

    const joiner = (index: number, length: number) => {
        if (length == 1 || index == 0) return "";
        const delim = length > 2 ? "," : "";
        if (index == length - 1) return `${delim} and `;
        return `${delim} `;
    };
    const label = (creature: Creature) => {
        if (!creature) return;
        let label = [];
        if (creature.hp) {
            label.push(`HP: ${creature.hp}`);
        }
        if (creature.ac) {
            label.push(`AC: ${creature.ac}`);
        }
        if (creature.modifier) {
            label.push(`MOD: ${creature.modifier}`);
        }
        return `${label.join(", ")}`;
    };
</script>

<span class="encounter-line encounter-row">
    <span>
        {#if creatures.size}
            {#each [...creatures] as [creature, count], index}
                <span aria-label={label(creature)}>
                    {joiner(index, creatures.size)}
                    <strong
                        use:rollerEl={creature}
                    />&nbsp;{creature.name}{count == 1 ? "" : "s"}
                </span>
            {/each}
        {:else}
            -
        {/if}
    </span>
    <span class="icons">
        <span
            use:openButton
            on:click|stopPropagation={open}
            aria-label="Begin Encounter"
        />
        <span
            use:addButton
            on:click|stopPropagation={add}
            aria-label="Add to Encounter"
        />
    </span>
</span>

<style>
    .encounter-line {
        display: flex;
        gap: 1rem;
    }
    .icons {
        display: flex;
    }
    .icons > span :global(.clickable-icon) {
        margin-right: 0;
    }
</style>

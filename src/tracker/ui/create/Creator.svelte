<script lang="ts">
    import { ButtonComponent, Platform } from "obsidian";
    import type InitiativeTracker from "src/main";
    import { tracker } from "src/tracker/stores/tracker";
    import { Creature } from "src/utils/creature";
    import { createEventDispatcher } from "svelte";
    import { writable } from "svelte/store";
    import Create from "./Create.svelte";
    import List from "./List.svelte";

    const dispatch = createEventDispatcher();

    export let plugin: InitiativeTracker;
    export let isEditing = false;
    export let creature: Creature = null;

    const adding = writable<Array<[Creature, number]>>([]);
    const editing = writable<Creature>(creature);

    const cancel = (node: HTMLElement) => {
        new ButtonComponent(node)
            .setCta()
            .setButtonText("Cancel")
            .onClick(() => {
                dispatch("close");
            });
    };

    const add = (node: HTMLElement) => {
        new ButtonComponent(node)
            .setButtonText(isEditing ? "Save" : "Add to Encounter")
            .onClick(() => {
                if (!$adding.length && !isEditing) return;
                if (isEditing) {
                    if ($editing.hp != creature.max) {
                        creature.max = $editing.hp;
                    }
                    tracker.replace(creature, $editing);
                } else {
                    const creatures = $adding.flatMap(([creature, amount]) =>
                        [...Array(amount).keys()].map((k) =>
                            Creature.new(creature)
                        )
                    );

                    tracker.add(...creatures);
                }
                dispatch("close");
            });
    };
</script>

<div
    class="initiative-tracker-creator-container"
    class:mobile={Platform.isMobileApp}
>
    <div class="initiative-tracker-creator" class:editing={isEditing}>
        <Create {plugin} {editing} {adding} {isEditing} />
        {#if !isEditing}
            <List {adding} {editing} />
        {/if}
    </div>
    <div class="buttons">
        <div use:cancel />
        <div use:add disabled={!$adding.length && !isEditing} />
    </div>
</div>

<style scoped>
    .initiative-tracker-creator {
        margin-top: 1rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
    }
    .initiative-tracker-creator.editing {
        grid-template-columns: 1fr;
    }
    .buttons {
        display: flex;
        margin-left: auto;
        justify-content: flex-end;
        gap: 0.5rem;
    }

    div[disabled="true"] > :global(button) {
        cursor: not-allowed;
    }
</style>

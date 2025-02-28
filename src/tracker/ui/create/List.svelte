<script lang="ts">
    import { ExtraButtonComponent, setIcon } from "obsidian";
    import { AC, DEFAULT_UNDEFINED, HIDDEN, HP, INITIATIVE } from "src/utils";
    import type { Creature } from "src/utils/creature";
    import type { Writable } from "svelte/store";

    export let adding: Writable<Array<[Creature, number]>>;
    export let editing: Writable<Creature>;

    const minusIcon = (node: HTMLElement, creature: Creature) => {
        new ExtraButtonComponent(node).setIcon("minus");
    };
    const minus = (evt: MouseEvent, index: number) => {
        if ($adding[index][1] - 1 < 1) {
            del(evt, index);
            return;
        }
        $adding[index][1] -= 1;
        $adding = $adding;
    };
    const plusIcon = (node: HTMLElement, creature: Creature) => {
        new ExtraButtonComponent(node).setIcon("plus");
    };
    const add = (evt: MouseEvent, index: number) => {
        $adding[index][1] += 1;
        $adding = $adding;
    };
    const delIcon = (node: HTMLElement, creature: Creature) => {
        new ExtraButtonComponent(node).setIcon("trash");
    };
    const del = (evt: MouseEvent, index: number) => {
        $adding.splice(index, 1);
        $adding = $adding;
    };
    const heart = (node: HTMLElement) => {
        setIcon(node, HP);
    };
    const ac = (node: HTMLElement) => {
        setIcon(node, AC);
    };
    const init = (node: HTMLElement) => {
        setIcon(node, INITIATIVE);
    };
    const hidden = (node: HTMLElement) => {
        setIcon(node, HIDDEN);
    };
</script>

<div class="initiative-tracker-list">
    {#if $adding.length}
        {#each $adding as [creature, number], index}
            <div class="creature" on:click={() => ($editing = creature)}>
                <div class="creature-metadata">
                    <div class="creature-name">{creature.getName()}</div>
                    <div class="creature-amount">
                        <div
                            class="creature-minus"
                            use:minusIcon={creature}
                            on:click|stopPropagation={(evt) =>
                                minus(evt, index)}
                        />
                        <div class="creature-number">{number}</div>
                        <div
                            class="creature-minus"
                            use:plusIcon={creature}
                            on:click|stopPropagation={(evt) => add(evt, index)}
                        />
                        <div
                            class="creature-delete"
                            use:delIcon={creature}
                            on:click|stopPropagation={(evt) => del(evt, index)}
                        />
                    </div>
                </div>
                <small class="creature-data">
                    <span
                        >{creature.hp ?? DEFAULT_UNDEFINED}
                        <span use:heart /></span
                    >
                    <span
                        >{creature.ac ?? DEFAULT_UNDEFINED}
                        <span use:ac /></span
                    >
                    <span
                        >{creature.initiative ?? DEFAULT_UNDEFINED}
                        <span use:init /></span
                    >
                    {#if creature.hidden}
                        <span use:hidden />
                    {/if}
                </small>
            </div>
        {/each}
    {:else}
        <span>Add a creature.</span>
    {/if}
</div>

<style scoped>
    .initiative-tracker-list {
        display: flex;
        flex-flow: column nowrap;
        gap: 0.5rem;
    }

    .creature {
        border-radius: 0.5rem;
        padding: 0.5rem;
    }
    .creature:hover {
        background-color: var(--background-secondary);
    }

    .creature-metadata {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .creature-amount {
        margin-left: auto;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        align-items: center;
        text-align: center;
    }
    .creature-data {
        --icon-size: 10px;
        display: flex;
        align-items: center;
        gap: 0.375rem;
    }
</style>

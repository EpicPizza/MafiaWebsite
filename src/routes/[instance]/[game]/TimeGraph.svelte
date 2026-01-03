<script lang=ts>
    import type { CompleteUser, User } from "$lib/Discord/users.server";
    import Line from "$lib/Builders/Line.svelte";
    import AxisX from "$lib/LayerCake/MultiLine/AxisX.percent-range.html.svelte";
    import AxisY from "$lib/LayerCake/MultiLine/AxisY.percent-range.html.svelte";
    import GroupLabels from "$lib/LayerCake/MultiLine/GroupLabels.html.svelte";
    import MultiLine from "$lib/LayerCake/MultiLine/MultiLine.svelte";
    import SharedTooltip from "$lib/LayerCake/MultiLine/SharedTooltip.percent-range.html.svelte";
    import { LayerCake, ScaledSvg, Html, flatten } from "layercake";
    import { scaleOrdinal } from "d3-scale";
    import { timeParse, timeFormat } from "d3-time-format";
    import { format } from "d3-format";
    import dnt from 'date-and-time';
    import meridiem from "date-and-time/plugin/meridiem";

    dnt.plugin(meridiem);

    interface Props {
        stats: { [key: string]: number; }[],
        users: CompleteUser[],
    }

    const { stats: dataStats, users }: Props = $props();

    const stats = $derived(dataStats.map(stat => ({ interval: new Date(stat.interval), ...stat }))) as unknown as { [key: string]: number; }[];

    const xKey = 'interval';
    const yKey = 'value';
    const zKey = 'player';    

    const seriesNames = Object.keys(stats[0]).filter(d => d !== xKey);
    const seriesColors = seriesNames.map(id => users.find(user => user.id == id)?.color ?? "#aaaaaa")

    const dataLong = seriesNames.map(key => {
        return {
            [zKey]: key,
            values: stats.map(d => {
                // Put this in a conditional so that we don't recast the data on second render
                return {
                    [yKey]: d[key],
                    [xKey]: d[xKey],
                    [zKey]: key
                };
            })
        };
    });

    const formatLabelX = (date: Date) => { return dnt.format(new Date(date), "h:mm a"); };
    // @ts-ignore
    const formatLabelY = d => format(`~s`)(d);

    const formatLabelZ = (id: string) => users.find(user => user.id == id)?.nickname ?? id;
</script>        

<div class="-mx-4 px-4">
    <div class="min-w-[400px] min-h-[10rem] h-[10rem] mt-0 mb-[4.25rem] pl-4">
        <LayerCake
            ssr
            percentRange
            padding={{ top: 7, right: 10, bottom: 20, left: 25 }}
            x={xKey}
            y={yKey}
            z={zKey}
            zScale={scaleOrdinal()}
            zRange={seriesColors}
            flatData={flatten(dataLong, 'values')}
            yDomain={[0, null]}
            data={dataLong}
        >
            <div class="max-w-screen overflow-auto">
                <Html>
                    <AxisX
                        gridlines={false}
                        ticks={
                            stats.map(d => d[xKey]).sort((a, b) => a.valueOf() - b.valueOf()).filter((a, i) => i % Math.floor(stats.length / 20) == 0)
                        }
                        format={formatLabelX}
                        tickMarks
                    />
                    <AxisY format={formatLabelY} />
                </Html>

                <ScaledSvg>
                    <MultiLine />
                </ScaledSvg>
            </div>

            <Html>
                <SharedTooltip formatKey={formatLabelZ} formatTitle={formatLabelX} dataset={stats} />
            </Html>
        </LayerCake>
    </div>
</div>

<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-0.5">
    {#each users.filter(user => seriesNames.includes(user.id)) as user}
        <div class="w-full flex items-center gap-1.5">
            <div style="background-color: {user.color};" class="w-3 h-3 rounded-full"></div>
            <p class="font-normal text-sm opacity-75">{user.nickname}</p>
        </div>  
    {/each}
</div>
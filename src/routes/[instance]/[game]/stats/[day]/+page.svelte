<script lang=ts>
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
    import { form } from "$app/server";

    dnt.plugin(meridiem);

    const { data } = $props();

    const stats = $derived(data.stats.map(stat => ({ interval: new Date(stat.interval), ...stat }))) as unknown as typeof data["stats"];

    const xKey = 'interval';
    const yKey = 'value';
    const zKey = 'player';    

    const seriesNames = Object.keys(stats[0]).filter(d => d !== xKey);
    const seriesColors = seriesNames.map(id => data.users.find(user => user.id == id)?.color ?? "#aaaaaa")

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

    const formatLabelZ = (id: string) => data.users.find(user => user.id == id)?.nickname ?? id;

    console.log(flatten(dataLong, 'values'));
</script>

<div class="h-[calc(100dvh-4rem)] md:h-[calc(100dvh-2rem)] flex flex-col justify-around items-center">
    <div class="max-h-[calc(100dvh-10rem)] md:max-h-full max-w-[calc(100vw-2rem)] overflow-auto w-[40rem] bg-white dark:bg-zinc-800 border border-border-light dark:border-border-dark p-8 rounded-2xl relative">
        <h1 class="text-xl font-bold">Beta Stats</h1>

        <Line class="mb-6 mt-2"></Line>

        <div class="min-w-[400px] min-h-[10rem] h-[10rem] mt-20 mb-20">
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

                <Html>
                    <GroupLabels formatLabel={formatLabelZ} />
                    <SharedTooltip formatLabel={formatLabelZ} formatTitle={formatLabelX} dataset={stats} />
                </Html>
            </LayerCake>
        </div>


        <p class="whitespace-pre">  
            {JSON.stringify(data, null, "\t")}
        </p>
    </div>
</div>

<style>
  /*
    The wrapper div needs to have an explicit width and height in CSS.
    It can also be a flexbox child or CSS grid element.
    The point being it needs dimensions since the <LayerCake> element will
    expand to fill it.
  */
  .chart-container {
    width: 100%;
    height: 250px;
  }
</style>
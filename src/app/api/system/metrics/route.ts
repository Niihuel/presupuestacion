import os from "os";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMemPct = totalMem > 0 ? (1 - freeMem / totalMem) * 100 : 0;
    const cpus = os.cpus() ?? [];
    const perCore = cpus.map((c)=>({ model: c.model, speed: c.speed }));
    // Medición por delta configurable para uso de CPU en tiempo real
    const url = new URL(req.url);
    const clamp = (n:number,min:number,max:number)=> Math.max(min, Math.min(max, n));
    const intervalMs = clamp(Number(url.searchParams.get('intervalMs') ?? '200'), 50, 1000);
    const snap1 = cpus.map(c=>({ ...c.times }));
    await new Promise(r=>setTimeout(r, intervalMs));
    const snap2 = os.cpus().map(c=>({ ...c.times }));
    type CpuTimes = { user: number; nice: number; sys: number; idle: number; irq: number };
    function pct(a: CpuTimes, b: CpuTimes){
      const idle = Math.max(0, b.idle - (a.idle??0));
      const total = Math.max(1, (b.user - (a.user??0)) + (b.nice - (a.nice??0)) + (b.sys - (a.sys??0)) + (b.irq - (a.irq??0)) + idle);
      return (1 - idle/total) * 100;
    }
    const perCorePct = snap2.map((t, i)=> pct(snap1[i] as any, t as any));
    const cpuUsagePct = perCorePct.reduce((a,v)=> a+v, 0) / (perCorePct.length || 1);
    // loadavg en Windows suele dar 0; lo enviamos igualmente
    const load = os.loadavg?.()[0] ?? 0;
    const uptimeSecs = os.uptime();
    return NextResponse.json({
      platform: os.platform(),
      arch: os.arch(),
      cpuCount: cpus.length,
      perCore,
      perCorePct,
      cpuUsagePct,
      load1m: load,
      totalMem,
      freeMem,
      usedMemPct,
      uptimeSecs,
      ts: Date.now(),
    });
  } catch (err) {
    return NextResponse.json({ error: "metrics_failed" }, { status: 500 });
  }
}



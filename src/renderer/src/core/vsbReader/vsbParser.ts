import MessageBuffer from '@renderer/core/vsbReader/VsbBuffer'
import {
  GlobalModType,
  Mod,
  ModData,
  Note,
  NoteExtra,
  PerFrame,
  VividStasisChart
} from '@renderer/core/vsbReader/typings';

function TypeToBufferType(t: number): number {
  if (t === 176) {
    return 1;
  }
  if (t === 177) {
    return 2;
  }
  if (t === 178) {
    return 5;
  }
  if (t === 179) {
    return 6;
  }
  if (t === 181) {
    return 7;
  }
  if (t === 182) {
    return 8;
  }
  if (t === 183) {
    return 10;
  }
  if (t === 184) {
    return 11;
  }
  if ([1, 2, 4, 5].includes(t)) {
    return 8;
  }
  if ([3, 6].includes(t)) {
    return 1;
  }
  if (t === 7) {
    return 2;
  }
  return 2;
}

function getModNameFromByte(mod: number): string {
  if (mod && 128 === 128) {
    return mod.toString();
  }
  return GlobalModType[mod]
}

class VsbParser {
  private chart: VividStasisChart;
  private reader: MessageBuffer;

  constructor(b: Uint8Array | ArrayBuffer) {
    this.chart = new VividStasisChart();
    this.reader = new MessageBuffer(new Uint8Array(b));
  }

  run(): VividStasisChart {
    this.chart.notes = [];
    while (true) {
      const flag = this.reader.readByte();
      if (flag === 192) {
        while (true) {
          const flag2 = this.reader.readByte();
          if (flag2 === 160) {
            this.readNote();
          } else if (flag2 === 193) {
            break
          }
        }
      } else if (flag === 224) {
        const modData = new ModData();
        modData.Obj = "obj_base_gimmick";
        modData.Proxies = 1;
        const modList: Mod[] = [];
        const perFrameList: PerFrame[] = [];
        while (true) {
          const flag3 = this.reader.readByte();
          if (flag3 === 228) {
            modData.Proxies = this.reader.readSByte();
          } else if (flag3 === 229) {
            modData.Obj = this.reader.readString();
          } else if (flag3 === 226) {
            while (true) {
              const flag4 = this.reader.readByte();
              if (flag4 === 223) {
                const m = new Mod();
                m.B = this.reader.readFloat();
                m.D = this.reader.readFloat();
                m.E = this.reader.readSByte();
                m.V1 = this.reader.readFloat();
                m.V2 = this.reader.readFloat();
                m.M = getModNameFromByte(this.reader.readSByte());
                m.P = this.reader.readSByte();
                modList.push(m);
              } else if (flag4 === 236) {
                const p = new PerFrame();
                p.B = this.reader.readFloat();
                p.E = this.reader.readFloat();
                p.F = this.reader.readString();
                perFrameList.push(p);
              } else if (flag4 === 227) {
                break;
              }
            }
            this.chart.mods.ModList = modList;
            this.chart.mods.PerFrameList = perFrameList;
            this.chart.mods.modData = modData;
          } else if (flag3 === 225) {
            break;
          }
        }
      } else if (flag === 255) {
        break;
      }
    }
    return this.chart;
  }

  private readNote(): void {
    const note = new Note();
    while (true) {
      const flag = this.reader.readByte();
      if (flag === 161) {
        break;
      }
      if (flag === 162) {
        note.type = this.reader.readSByte();
      } else if (flag === 163) {
        note.lane = this.reader.readSByte();
      } else if (flag === 164) {
        note.time = this.reader.readFloat();
      } else if (flag === 166) {
        const extra: NoteExtra[] = [];
        while (true) {
          const type = this.reader.readByte();
          if (type === 167) {
            break;
          }
          const id = this.reader.readSByte();
          const value = this.reader.readByNoteType(TypeToBufferType(type));

          const NE = new NoteExtra();
          NE.id = id;
          NE.value = value;
          extra.push(NE);
        }
        note.extra = extra;
      }
    }
    this.chart.notes.push(note);
  }
}

export default VsbParser;

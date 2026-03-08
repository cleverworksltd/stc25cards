import React from 'react';
import { PipeData } from '../types';
import { PIPE_STATUS_CODES, PIPE_FLOW_CODES, PIPE_SHAPE_CODES, PIPE_MATERIAL_CODES } from '../constants';

interface PipeTableProps {
  pipes: PipeData[];
  onChange: (ref: string, field: keyof PipeData, value: string) => void;
  title: string;
}

const PipeTable: React.FC<PipeTableProps> = ({ pipes, onChange, title }) => {
  return (
    <div className="mb-4 group">
      <div className="flex items-center justify-between mb-1 border-b border-brand-200">
        <h4 className="text-[10px] font-bold uppercase text-brand-900 flex items-center gap-1 py-0.5">
           {title}
        </h4>
      </div>

      <div className="rounded-sm border border-slate-400 bg-white overflow-hidden print:border-slate-500">
        <table className="w-full text-[8.5px] border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-400">
              <th className="p-1 border-r border-slate-300 w-[5%] text-slate-700 font-bold">#</th>
              <th className="p-1 border-r border-slate-300 w-[13%] text-slate-700 font-bold">STAT</th>
              <th className="p-1 border-r border-slate-300 w-[11%] text-slate-700 font-bold">FLOW</th>
              <th className="p-1 border-r border-slate-300 w-[10%] text-slate-700 font-bold">INV LVL</th>
              <th className="p-1 border-r border-slate-300 w-[12%] text-slate-700 font-bold">DEPTH (mm)</th>
              <th className="p-1 border-r border-slate-300 w-[9%] text-slate-700 font-bold">NODE</th>
              <th className="p-1 border-r border-slate-300 w-[10%] text-slate-700 font-bold">SHAPE</th>
              <th className="p-1 border-r border-slate-300 w-[14%] text-slate-700 font-bold">MAT</th>
              <th className="p-1 border-r border-slate-300 w-[10%] text-slate-700 font-bold">DIA (mm)</th>
              <th className="p-1 w-[6%] text-slate-700 font-bold">BD-D</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {pipes.map((pipe) => (
              <tr key={pipe.id} className="h-7 hover:bg-slate-50/50">
                <td className="p-0 text-center font-bold bg-slate-100 border-r border-slate-300 text-brand-900">{pipe.ref}</td>
                <td className="p-0 border-r border-slate-300">
                  <select 
                    className="w-full h-full text-[7.5px] text-center bg-transparent focus:bg-white outline-none cursor-pointer appearance-none p-0" 
                    value={pipe.status || ''} 
                    onChange={(e) => onChange(pipe.ref, 'status', e.target.value)}
                  >
                    <option value=""></option>
                    {PIPE_STATUS_CODES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.label}</option>)}
                  </select>
                </td>
                <td className="p-0 border-r border-slate-300">
                  <select 
                    className="w-full h-full text-[7.5px] text-center bg-transparent focus:bg-white outline-none cursor-pointer appearance-none p-0" 
                    value={pipe.flow || ''} 
                    onChange={(e) => onChange(pipe.ref, 'flow', e.target.value)}
                  >
                    <option value=""></option>
                    {PIPE_FLOW_CODES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.label}</option>)}
                  </select>
                </td>
                <td className="p-0 border-r border-slate-300">
                  <input type="text" className="w-full h-full text-center bg-transparent focus:bg-white outline-none p-0" value={pipe.invertLevel || ''} onChange={(e) => onChange(pipe.ref, 'invertLevel', e.target.value)} />
                </td>
                <td className="p-0 border-r border-slate-300">
                  <input type="text" className="w-full h-full text-center bg-transparent focus:bg-white outline-none p-0" value={pipe.depth || ''} onChange={(e) => onChange(pipe.ref, 'depth', e.target.value)} />
                </td>
                <td className="p-0 border-r border-slate-300">
                  <input type="text" className="w-full h-full text-center bg-transparent focus:bg-white outline-none p-0 uppercase" value={pipe.nodeRef || ''} onChange={(e) => onChange(pipe.ref, 'nodeRef', e.target.value)} />
                </td>
                <td className="p-0 border-r border-slate-300">
                  <select 
                    className="w-full h-full text-[7.5px] text-center bg-transparent focus:bg-white outline-none cursor-pointer appearance-none p-0" 
                    value={pipe.shape || ''} 
                    onChange={(e) => onChange(pipe.ref, 'shape', e.target.value)}
                  >
                    <option value=""></option>
                    {PIPE_SHAPE_CODES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.label}</option>)}
                  </select>
                </td>
                <td className="p-0 border-r border-slate-300">
                  <select 
                    className="w-full h-full text-[7.5px] text-center bg-transparent focus:bg-white outline-none cursor-pointer appearance-none p-0" 
                    value={pipe.material || ''} 
                    onChange={(e) => onChange(pipe.ref, 'material', e.target.value)}
                  >
                    <option value=""></option>
                    {PIPE_MATERIAL_CODES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.label}</option>)}
                  </select>
                </td>
                <td className="p-0 border-r border-slate-300">
                  <input type="text" className="w-full h-full text-center bg-transparent focus:bg-white outline-none p-0" value={pipe.diameter || ''} onChange={(e) => onChange(pipe.ref, 'diameter', e.target.value)} />
                </td>
                <td className="p-0">
                  <input type="text" className="w-full h-full text-center bg-transparent focus:bg-white outline-none p-0" value={pipe.backdropDia || ''} onChange={(e) => onChange(pipe.ref, 'backdropDia', e.target.value)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PipeTable;
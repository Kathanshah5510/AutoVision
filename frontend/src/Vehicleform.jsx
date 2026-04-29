// VehicleForm.jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Car, Calendar, Gauge } from 'lucide-react'

const CAR_MODELS = [
    "Maruti Alto", "Maruti Swift", "Maruti Baleno", "Maruti Wagon R",
    "Hyundai i10", "Hyundai i20", "Hyundai Creta", "Hyundai Verna",
    "Honda City", "Honda Amaze",
    "Tata Nexon", "Tata Harrier", "Tata Tiago",
    "Kia Seltos", "Kia Sonet",
    "Mahindra XUV700", "Mahindra Scorpio",
    "Toyota Fortuner", "Toyota Innova",
    "BMW 3 Series", "Audi A4", "Mercedes C-Class",
]

export default function VehicleForm({ vehicleData, onChange }) {
    const currentYear = new Date().getFullYear()

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-5 space-y-4"
        >
            <div className="flex items-center gap-2 mb-1">
                <Car className="w-4 h-4 text-cyan-400" />
                <span className="font-display text-xs text-slate-300 tracking-wider uppercase">
                    Vehicle Details
                </span>
                <span className="text-[10px] font-mono text-slate-500 ml-auto">
                    Used for accurate claim estimation
                </span>
            </div>

            {/* Car Model */}
            <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400">Car Model</label>
                <select
                    value={vehicleData.car_model}
                    onChange={e => onChange({ ...vehicleData, car_model: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700
                     text-sm text-slate-200 focus:border-cyan-500 focus:outline-none
                     transition-colors"
                >
                    {CAR_MODELS.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Purchase Year */}
                <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Purchase Year
                    </label>
                    <input
                        type="number"
                        min={currentYear - 15}
                        max={currentYear}
                        value={vehicleData.purchase_year}
                        onChange={e => onChange({ ...vehicleData, purchase_year: parseInt(e.target.value) })}
                        className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700
                       text-sm text-slate-200 focus:border-cyan-500 focus:outline-none
                       transition-colors"
                    />
                    <span className="text-[10px] text-slate-500">
                        Age: {currentYear - vehicleData.purchase_year} years
                    </span>
                </div>

                {/* Km Driven */}
                <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-400 flex items-center gap-1">
                        <Gauge className="w-3 h-3" /> KM Driven
                    </label>
                    <input
                        type="number"
                        min={0}
                        max={300000}
                        step={1000}
                        value={vehicleData.km_driven}
                        onChange={e => onChange({ ...vehicleData, km_driven: parseInt(e.target.value) })}
                        className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700
                       text-sm text-slate-200 focus:border-cyan-500 focus:outline-none
                       transition-colors"
                    />
                    <span className="text-[10px] text-slate-500">
                        {vehicleData.km_driven >= 80000 ? '⚠ High mileage' : 'Normal range'}
                    </span>
                </div>
            </div>
        </motion.div>
    )
}
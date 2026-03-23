"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const typeorm_1 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    const ds = app.get(typeorm_1.DataSource, { strict: false });
    if (ds) {
        try {
            const istanbulStations = [
                { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'Test Durak (Merkez)', lat: 41.015, lng: 28.975 },
                { id: '11111111-a111-1111-1111-111111111111', name: 'Taksim Meydan Taksi', lat: 41.0368, lng: 28.9850 },
                { id: '22222222-b222-2222-2222-222222222222', name: 'Kadıköy İskele Taksi', lat: 40.9900, lng: 29.0220 },
                { id: '33333333-c333-3333-3333-333333333333', name: 'Beşiktaş Meydan Taksi', lat: 41.0422, lng: 29.0067 },
                { id: '44444444-d444-4444-4444-444444444444', name: 'Mecidiyeköy Merkez', lat: 41.0667, lng: 28.9917 },
                { id: '55555555-e555-5555-5555-555555555555', name: 'Eminönü İskele Taksi', lat: 41.0163, lng: 28.9723 },
                { id: '66666666-f666-6666-6666-666666666666', name: 'Üsküdar Meydan Taksi', lat: 41.0264, lng: 29.0142 },
                { id: '77777777-a777-7777-7777-777777777777', name: 'Levent Çarşı Taksi', lat: 41.0827, lng: 29.0125 },
                { id: '88888888-b888-8888-8888-888888888888', name: 'Bakırköy Meydan Taksi', lat: 40.9791, lng: 28.8727 },
                { id: '99999999-c999-9999-9999-999999999999', name: 'Şirinevler Taksi', lat: 40.9934, lng: 28.8358 },
            ];
            for (const s of istanbulStations) {
                const p1 = `${s.lng - 0.005} ${s.lat - 0.005}`;
                const p2 = `${s.lng + 0.005} ${s.lat - 0.005}`;
                const p3 = `${s.lng + 0.005} ${s.lat + 0.005}`;
                const p4 = `${s.lng - 0.005} ${s.lat + 0.005}`;
                const polygon = `POLYGON((${p1}, ${p2}, ${p3}, ${p4}, ${p1}))`;
                await ds.query(`
          INSERT INTO stations (id, name, "centerLat", "centerLng", "radiusMeters", geofence)
          VALUES ($1, $2, $3, $4, 500, ST_GeomFromEWKT('SRID=4326;' || $5))
          ON CONFLICT (id) DO NOTHING;
        `, [s.id, s.name, s.lat, s.lng, polygon]);
            }
            console.log('Seeded Istanbul taxi stations');
            const TEST_UUID = '123e4567-e89b-12d3-a456-426614174000';
            await ds.query(`INSERT INTO drivers (id, name, "licensePlate", phone, status, "stationId")
         VALUES ($1, 'Test Driver', '34TEST', '05009876543', 'available', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
         ON CONFLICT (id) DO UPDATE SET status = 'available', "stationId" = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';`, [TEST_UUID]);
            console.log('Seeded test driver:', TEST_UUID);
            const adminPass = await bcrypt.hash('admin123', 10);
            const driverPass = await bcrypt.hash('driver123', 10);
            await ds.query(`INSERT INTO users (id, phone, "passwordHash", role, name)
         VALUES 
         ('11111111-1111-1111-1111-111111111111', '05001234567', $1, 'admin', 'Admin Manager'),
         ('22222222-2222-2222-2222-222222222222', '05009876543', $2, 'driver', 'Test Driver User')
         ON CONFLICT (phone) DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash";`, [adminPass, driverPass]);
            console.log('Seeded test Auth Users (Admin and Driver)');
        }
        catch (e) {
            console.log('Seed warning:', e.message);
        }
    }
    await app.listen(process.env.PORT ?? 3000);
    console.log('GeoDurak Backend running on http://localhost:3000');
}
bootstrap();
//# sourceMappingURL=main.js.map
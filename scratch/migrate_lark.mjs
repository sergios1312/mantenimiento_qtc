import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

// 1. Cargar variables de entorno
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf8");
  envFile.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan variables de entorno de Supabase.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// Normalizadores
function normalizarTexto(texto) {
  if (!texto) return "";
  return texto
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizarDocumento(doc) {
  if (!doc) return "";
  let d = doc.trim();
  if (d.length > 11) {
    return d.substring(0, 11);
  }
  if (d.length > 0 && d.length < 8) {
    return d.padStart(8, "0");
  }
  return d;
}

function clasificarTipoEquipo(modelo) {
  if (!modelo) return "ACCESORIOS";
  const m = normalizarTexto(modelo);

  const drones = ["T20P", "T25", "T25P", "T40", "T50", "T70P", "T100"];
  const generadores = ["D6000I", "D12000IE", "D12000IEP", "D14000IE"];
  const cargadores = ["C8000", "C10000", "C12000"];
  const controles = ["RC PLUS", "RC PLUS 2"];
  const baterias = ["DB800", "DB1560", "DB2160"];

  if (drones.some((d) => m.includes(d))) return "DRON";
  if (generadores.some((g) => m.includes(g))) return "GENERADOR";
  if (cargadores.some((c) => m.includes(c))) return "CARGADOR";
  if (controles.some((c) => m.includes(c))) return "CONTROL REMOTO";
  if (baterias.some((b) => m.includes(b))) return "BATERIA";

  return "ACCESORIOS";
}

async function clearData() {
  console.log("Limpiando datos antiguos...");
  // Al borrar clientes y equipos, las foreign keys en casos se pondrán a NULL
  // porque están configuradas con ON DELETE SET NULL.
  await supabase.from("clientes").delete().neq("id", 0);
  await supabase.from("equipos").delete().neq("id", 0);
  console.log("Datos limpiados.");
}

async function run() {
  await clearData();

  const csvPath = path.resolve(process.cwd(), "Datos lark(datos).csv");
  if (!fs.existsSync(csvPath)) {
    console.error(`No se encontró el archivo: ${csvPath}`);
    process.exit(1);
  }

  console.log("Leyendo CSV...");
  const rawData = fs.readFileSync(csvPath, "latin1");
  const records = parse(rawData, {
    delimiter: ";",
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`Se encontraron ${records.length} registros. Procesando...`);

  let clientesCreados = 0;
  let equiposCreados = 0;
  let casosActualizados = 0;

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    
    const casoRaw = row["caso"] || Object.values(row)[0];
    const nombre = normalizarTexto(row["nombre"]);
    const documento = normalizarDocumento(row["documento"]);
    const telefono = (row["telefono"] || "").trim();
    const modelo = normalizarTexto(row["modelo"]);
    const serie = normalizarTexto(row["serie"]);

    if (!casoRaw) continue;

    const numeracionCaso = casoRaw.trim().padStart(4, "0");
    
    let clienteId = null;
    let equipoId = null;

    // 1. Gestionar Cliente
    if (documento) {
      const { data: clienteExistente } = await supabase
        .from("clientes")
        .select("id")
        .eq("documento", documento)
        .single();

      if (clienteExistente) {
        clienteId = clienteExistente.id;
      } else {
        const { data: nuevoCliente, error: errC } = await supabase
          .from("clientes")
          .insert({
            documento: documento,
            nombre: nombre || "SIN NOMBRE",
            telefono: telefono || null,
          })
          .select("id")
          .single();

        if (errC) {
          console.error(`Error creando cliente ${documento}:`, errC.message);
        } else if (nuevoCliente) {
          clienteId = nuevoCliente.id;
          clientesCreados++;
        }
      }
    }

    // 2. Gestionar Equipo
    if (serie) {
      const { data: equipoExistente } = await supabase
        .from("equipos")
        .select("id")
        .eq("serie", serie)
        .single();

      if (equipoExistente) {
        equipoId = equipoExistente.id;
      } else {
        const tipo = clasificarTipoEquipo(modelo);
        const { data: nuevoEquipo, error: errE } = await supabase
          .from("equipos")
          .insert({
            serie: serie,
            modelo: modelo || "DESCONOCIDO",
            tipo: tipo,
          })
          .select("id")
          .single();

        if (errE) {
          console.error(`Error creando equipo ${serie}:`, errE.message);
        } else if (nuevoEquipo) {
          equipoId = nuevoEquipo.id;
          equiposCreados++;
        }
      }
    }

    // 3. Asociar al Caso
    if (clienteId || equipoId || serie || documento) {
      const updateData = {};
      if (clienteId) updateData.cliente_id = clienteId;
      if (equipoId) updateData.equipo_id = equipoId;
      // También guardamos los datos de texto en las columnas correspondientes
      if (serie) updateData.serie = serie;
      if (documento) updateData.dni = documento;
      if (nombre) updateData.cliente = nombre;
      if (modelo) updateData.modelo = modelo; // Ojo, ahora se llama "modelo" no "equipo"

      const { error: errUpdate } = await supabase
        .from("casos")
        .update(updateData)
        .eq("numeracion_caso", numeracionCaso);

      if (errUpdate) {
        console.error(`Error actualizando caso ${numeracionCaso}:`, errUpdate.message);
      } else {
        casosActualizados++;
      }
    }
  }

  console.log("-----------------------------------------");
  console.log("Migración completada.");
  console.log(`- Clientes nuevos creados: ${clientesCreados}`);
  console.log(`- Equipos nuevos creados: ${equiposCreados}`);
  console.log(`- Casos actualizados: ${casosActualizados}`);
  console.log("-----------------------------------------");
}

run().catch(console.error);

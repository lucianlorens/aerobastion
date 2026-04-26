// Modelo paramétrico de uma estação de drone inspirada no ninho do joão-de-barro
// Ferramenta: OpenSCAD (https://openscad.org)
// Exportar como STL: F6 (Render) -> File -> Export -> STL

// =========================
// Parâmetros principais
// =========================
outer_radius = 120;      // raio externo (mm)
wall_thickness = 8;      // espessura das paredes
height = 90;             // altura total
entrance_radius = 35;    // raio da entrada frontal
entrance_length = 60;    // comprimento do túnel de entrada
platform_radius = 60;    // área interna para pouso do drone
vent_holes = 6;          // número de furos de ventilação

// =========================
// Corpo principal (forma orgânica simples)
// =========================
module shell() {
    difference() {
        sphere(r = outer_radius);
        sphere(r = outer_radius - wall_thickness);
        translate([0,0,-outer_radius])
            cube([outer_radius*2, outer_radius*2, outer_radius]);
    }
}

// =========================
// Entrada tipo túnel (ninho)
// =========================
module entrance() {
    translate([outer_radius - entrance_length/2, 0, 0])
        rotate([0,90,0])
            cylinder(h = entrance_length, r = entrance_radius, center=true);
}

// =========================
// Plataforma interna plana
// =========================
module platform() {
    translate([0,0,-height/4])
        cylinder(h = 10, r = platform_radius, center=true);
}

// =========================
// Furos de ventilação
// =========================
module vents() {
    for (i = [0:vent_holes-1]) {
        angle = 360/vent_holes * i;
        rotate([0,0,angle])
            translate([outer_radius - wall_thickness/2, 0, 0])
                rotate([90,0,0])
                    cylinder(h = wall_thickness+2, r = 5, center=true);
    }
}

// =========================
// Montagem final
// =========================
module drone_station() {
    difference() {
        union() {
            shell();
            platform();
        }
        entrance();
        vents();
    }
}

// Render final
drone_station();

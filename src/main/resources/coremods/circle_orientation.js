var Opcodes = Java.type('org.objectweb.asm.Opcodes');
var InsnList = Java.type('org.objectweb.asm.tree.InsnList');
var InsnNode = Java.type('org.objectweb.asm.tree.InsnNode');
var VarInsnNode = Java.type('org.objectweb.asm.tree.VarInsnNode');
var TypeInsnNode = Java.type('org.objectweb.asm.tree.TypeInsnNode');
var FieldInsnNode = Java.type('org.objectweb.asm.tree.FieldInsnNode');
var MethodInsnNode = Java.type('org.objectweb.asm.tree.MethodInsnNode');

function findMethod(c, n, d) {
  for (var i = 0; i < c.methods.size(); i++) {
    var m = c.methods.get(i);
    if (String(m.name) === n && String(m.desc) === d) return m;
  }
  return null;
}

function initializeCoreMod() {
  return {
    'eightfold_conjure_circle_face_direction': {
      target: { type: 'CLASS', name: 'vazkii.psi.common.spell.trick.entity.PieceTrickConjureCircle' },
      transformer: function(c) {
        var m = findMethod(c, 'execute', '(Lvazkii/psi/api/spell/SpellContext;)Ljava/lang/Object;');
        if (m == null) return c;

        // In Psi 110, local 3 is the normalized/user-supplied circle direction.
        // Eightfold makes Direction mean "the direction the circle should face" by
        // applying the user's old manual yaw correction internally:
        //   (x, y, z) -> (-z, y, x)
        // Insert immediately after the first ASTORE 3 in execute().
        var store = null;
        for (var n = m.instructions.getFirst(); n != null; n = n.getNext()) {
          if (n instanceof VarInsnNode && n.getOpcode() === Opcodes.ASTORE && n.var === 3) {
            store = n;
            break;
          }
        }
        if (store == null) return c;

        var p = new InsnList();
        p.add(new TypeInsnNode(Opcodes.NEW, 'vazkii/psi/api/internal/Vector3'));
        p.add(new InsnNode(Opcodes.DUP));
        p.add(new VarInsnNode(Opcodes.ALOAD, 3));
        p.add(new FieldInsnNode(Opcodes.GETFIELD, 'vazkii/psi/api/internal/Vector3', 'z', 'D'));
        p.add(new InsnNode(Opcodes.DNEG));
        p.add(new VarInsnNode(Opcodes.ALOAD, 3));
        p.add(new FieldInsnNode(Opcodes.GETFIELD, 'vazkii/psi/api/internal/Vector3', 'y', 'D'));
        p.add(new VarInsnNode(Opcodes.ALOAD, 3));
        p.add(new FieldInsnNode(Opcodes.GETFIELD, 'vazkii/psi/api/internal/Vector3', 'x', 'D'));
        p.add(new MethodInsnNode(Opcodes.INVOKESPECIAL, 'vazkii/psi/api/internal/Vector3', '<init>', '(DDD)V', false));
        p.add(new VarInsnNode(Opcodes.ASTORE, 3));
        m.instructions.insert(store, p);
        return c;
      }
    }
  };
}

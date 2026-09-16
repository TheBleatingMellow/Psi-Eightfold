// Psi: Eightfold core hooks for Psi 1.21.1-110.
//
// This file intentionally performs small runtime edits only. It does not embed
// or regenerate complete Psi method bodies. Original Psi methods are left in
// place except for drawConnectorSide(), whose Eightfold renderer is an
// independent implementation using Eightfold's own texture.

var Opcodes = Java.type('org.objectweb.asm.Opcodes');
var InsnNode = Java.type('org.objectweb.asm.tree.InsnNode');
var VarInsnNode = Java.type('org.objectweb.asm.tree.VarInsnNode');
var FieldInsnNode = Java.type('org.objectweb.asm.tree.FieldInsnNode');
var MethodInsnNode = Java.type('org.objectweb.asm.tree.MethodInsnNode');
var TypeInsnNode = Java.type('org.objectweb.asm.tree.TypeInsnNode');
var JumpInsnNode = Java.type('org.objectweb.asm.tree.JumpInsnNode');
var LabelNode = Java.type('org.objectweb.asm.tree.LabelNode');
var LdcInsnNode = Java.type('org.objectweb.asm.tree.LdcInsnNode');
var IntInsnNode = Java.type('org.objectweb.asm.tree.IntInsnNode');
var FieldNode = Java.type('org.objectweb.asm.tree.FieldNode');
var MethodNode = Java.type('org.objectweb.asm.tree.MethodNode');
var InsnList = Java.type('org.objectweb.asm.tree.InsnList');

var SIDE = 'vazkii/psi/api/spell/SpellParam$Side';
var SIDE_DESC = 'Lvazkii/psi/api/spell/SpellParam$Side;';
var PARAM_DESC = 'Lvazkii/psi/api/spell/SpellParam;';
var RUNTIME = 'dev/mellowb/psieightfold/runtime/EightfoldRuntime';

function method(c, name, desc) {
  for (var i = 0; i < c.methods.size(); i++) {
    var m = c.methods.get(i);
    if (String(m.name) === name && String(m.desc) === desc) return m;
  }
  return null;
}

function field(c, name) {
  for (var i = 0; i < c.fields.size(); i++) {
    if (String(c.fields.get(i).name) === name) return c.fields.get(i);
  }
  return null;
}

function pushInt(list, value) {
  if (value === -1) list.add(new InsnNode(Opcodes.ICONST_M1));
  else if (value >= 0 && value <= 5) list.add(new InsnNode(Opcodes.ICONST_0 + value));
  else if (value >= -128 && value <= 127) list.add(new IntInsnNode(Opcodes.BIPUSH, value));
  else if (value >= -32768 && value <= 32767) list.add(new IntInsnNode(Opcodes.SIPUSH, value));
  else list.add(new LdcInsnNode(value));
}

function lastReturn(m) {
  for (var n = m.instructions.getLast(); n != null; n = n.getPrevious()) {
    if (n.getOpcode() === Opcodes.RETURN) return n;
  }
  return null;
}

function injectConditionGuards(c) {
  var execute = method(c, 'execute', '(Lvazkii/psi/api/internal/IPlayerData;Lvazkii/psi/api/spell/SpellContext;)V');
  if (execute != null) {
    var cont = new LabelNode();
    var p = new InsnList();
    p.add(new VarInsnNode(Opcodes.ALOAD, 0));
    p.add(new FieldInsnNode(Opcodes.GETFIELD, 'vazkii/psi/api/spell/CompiledSpell$Action', 'piece', 'Lvazkii/psi/api/spell/SpellPiece;'));
    p.add(new VarInsnNode(Opcodes.ALOAD, 2));
    p.add(new MethodInsnNode(Opcodes.INVOKESTATIC, RUNTIME, 'shouldExecute', '(Lvazkii/psi/api/spell/SpellPiece;Lvazkii/psi/api/spell/SpellContext;)Z', false));
    p.add(new JumpInsnNode(Opcodes.IFNE, cont));
    p.add(new InsnNode(Opcodes.RETURN));
    p.add(cont);
    execute.instructions.insert(p);
  }

  var prediction = method(c, 'executePrediction', '(Lvazkii/psi/api/spell/SpellContext;)Z');
  if (prediction != null) {
    var cont2 = new LabelNode();
    var q = new InsnList();
    q.add(new VarInsnNode(Opcodes.ALOAD, 0));
    q.add(new FieldInsnNode(Opcodes.GETFIELD, 'vazkii/psi/api/spell/CompiledSpell$Action', 'piece', 'Lvazkii/psi/api/spell/SpellPiece;'));
    q.add(new VarInsnNode(Opcodes.ALOAD, 1));
    q.add(new MethodInsnNode(Opcodes.INVOKESTATIC, RUNTIME, 'shouldExecute', '(Lvazkii/psi/api/spell/SpellPiece;Lvazkii/psi/api/spell/SpellContext;)Z', false));
    q.add(new JumpInsnNode(Opcodes.IFNE, cont2));
    q.add(new InsnNode(Opcodes.ICONST_1));
    q.add(new InsnNode(Opcodes.IRETURN));
    q.add(cont2);
    prediction.instructions.insert(q);
  }
  return c;
}

function injectDiagonalMapping(m, operation) {
  if (m == null) return;
  var cont = new LabelNode();
  var p = new InsnList();
  p.add(new VarInsnNode(Opcodes.ALOAD, 0));
  pushInt(p, operation);
  p.add(new MethodInsnNode(Opcodes.INVOKESTATIC, RUNTIME, 'mapDiagonal', '(' + SIDE_DESC + 'I)' + SIDE_DESC, false));
  p.add(new InsnNode(Opcodes.DUP));
  p.add(new JumpInsnNode(Opcodes.IFNULL, cont));
  p.add(new InsnNode(Opcodes.ARETURN));
  p.add(cont);
  p.add(new InsnNode(Opcodes.POP));
  m.instructions.insert(p);
}

function addDiagonalSide(list, name, ordinal, offx, offy, minx, miny, maxx, maxy, u, v) {
  list.add(new TypeInsnNode(Opcodes.NEW, SIDE));
  list.add(new InsnNode(Opcodes.DUP));
  list.add(new LdcInsnNode(name));
  pushInt(list, ordinal);
  pushInt(list, offx); pushInt(list, offy);
  pushInt(list, minx); pushInt(list, miny);
  pushInt(list, maxx); pushInt(list, maxy);
  pushInt(list, u); pushInt(list, v);
  list.add(new MethodInsnNode(Opcodes.INVOKESPECIAL, SIDE, '<init>', '(Ljava/lang/String;IIIIIIIII)V', false));
  list.add(new FieldInsnNode(Opcodes.PUTSTATIC, SIDE, name, SIDE_DESC));
}

function extendSideEnum(c) {
  var flags = Opcodes.ACC_PUBLIC | Opcodes.ACC_STATIC | Opcodes.ACC_FINAL | Opcodes.ACC_ENUM;
  if (field(c, 'TOP_LEFT') == null) c.fields.add(new FieldNode(flags, 'TOP_LEFT', SIDE_DESC, null, null));
  if (field(c, 'TOP_RIGHT') == null) c.fields.add(new FieldNode(flags, 'TOP_RIGHT', SIDE_DESC, null, null));
  if (field(c, 'BOTTOM_LEFT') == null) c.fields.add(new FieldNode(flags, 'BOTTOM_LEFT', SIDE_DESC, null, null));
  if (field(c, 'BOTTOM_RIGHT') == null) c.fields.add(new FieldNode(flags, 'BOTTOM_RIGHT', SIDE_DESC, null, null));

  var cl = method(c, '<clinit>', '()V');
  if (cl != null) {
    var ret = lastReturn(cl);
    if (ret != null) {
      var p = new InsnList();
      // The u/v coordinates below belong to Eightfold's own transparent 256px
      // diagonal-arrow sheet, not Psi's programmer texture.
      addDiagonalSide(p, 'TOP_LEFT', 5, -1, -1, -9, -9, -9, -9, 0, 0);
      addDiagonalSide(p, 'TOP_RIGHT', 6, 1, -1, 9, -9, 9, -9, 8, 0);
      addDiagonalSide(p, 'BOTTOM_LEFT', 7, -1, 1, -9, 9, -9, 9, 0, 8);
      addDiagonalSide(p, 'BOTTOM_RIGHT', 8, 1, 1, 9, 9, 9, 9, 8, 8);

      // Replace the compiler-generated enum backing arrays after vanilla Psi
      // finishes its own initialization. Existing ordinals 0-4 are preserved.
      pushInt(p, 9);
      p.add(new TypeInsnNode(Opcodes.ANEWARRAY, SIDE));
      var names = ['OFF','TOP','BOTTOM','LEFT','RIGHT','TOP_LEFT','TOP_RIGHT','BOTTOM_LEFT','BOTTOM_RIGHT'];
      for (var i = 0; i < names.length; i++) {
        p.add(new InsnNode(Opcodes.DUP)); pushInt(p, i);
        p.add(new FieldInsnNode(Opcodes.GETSTATIC, SIDE, names[i], SIDE_DESC));
        p.add(new InsnNode(Opcodes.AASTORE));
      }
      p.add(new FieldInsnNode(Opcodes.PUTSTATIC, SIDE, '$VALUES', '[' + SIDE_DESC));

      pushInt(p, 8);
      p.add(new TypeInsnNode(Opcodes.ANEWARRAY, SIDE));
      var dirs = ['TOP','BOTTOM','LEFT','RIGHT','TOP_LEFT','TOP_RIGHT','BOTTOM_LEFT','BOTTOM_RIGHT'];
      for (var j = 0; j < dirs.length; j++) {
        p.add(new InsnNode(Opcodes.DUP)); pushInt(p, j);
        p.add(new FieldInsnNode(Opcodes.GETSTATIC, SIDE, dirs[j], SIDE_DESC));
        p.add(new InsnNode(Opcodes.AASTORE));
      }
      p.add(new FieldInsnNode(Opcodes.PUTSTATIC, SIDE, 'DIRECTIONS', '[' + SIDE_DESC));
      cl.instructions.insertBefore(ret, p);
    }
  }

  injectDiagonalMapping(method(c, 'getOpposite', '()' + SIDE_DESC), 0);
  injectDiagonalMapping(method(c, 'mirrorVertical', '()' + SIDE_DESC), 1);
  injectDiagonalMapping(method(c, 'rotateCW', '()' + SIDE_DESC), 2);
  injectDiagonalMapping(method(c, 'rotateCCW', '()' + SIDE_DESC), 3);
  return c;
}

function patchSpellPiece(c) {
  var ctor = method(c, '<init>', '(Lvazkii/psi/api/spell/Spell;)V');
  if (ctor != null) {
    for (var n = ctor.instructions.getFirst(); n != null; n = n.getNext()) {
      if (n instanceof MethodInsnNode && String(n.owner) === 'vazkii/psi/api/spell/SpellPiece' && String(n.name) === 'initParams') {
        var p = new InsnList();
        p.add(new VarInsnNode(Opcodes.ALOAD, 0));
        p.add(new MethodInsnNode(Opcodes.INVOKESTATIC, RUNTIME, 'afterInitParams', '(Lvazkii/psi/api/spell/SpellPiece;)V', false));
        ctor.instructions.insert(n, p);
        break;
      }
    }
  }

  var eval = method(c, 'getParamEvaluation', '(Lvazkii/psi/api/spell/SpellParam;)Ljava/lang/Object;');
  if (eval != null) {
    for (var e = eval.instructions.getFirst(); e != null; e = e.getNext()) {
      if (e instanceof MethodInsnNode && String(e.owner) === 'vazkii/psi/api/spell/SpellPiece' && String(e.name) === 'evaluate' && String(e.desc) === '()Ljava/lang/Object;') {
        var q = new InsnList();
        q.add(new VarInsnNode(Opcodes.ALOAD, 1));
        q.add(new InsnNode(Opcodes.SWAP));
        q.add(new MethodInsnNode(Opcodes.INVOKESTATIC, RUNTIME, 'evaluationFallback', '(Lvazkii/psi/api/spell/SpellParam;Ljava/lang/Object;)Ljava/lang/Object;', false));
        eval.instructions.insert(e, q);
        break;
      }
    }
  }
  return c;
}

function patchParamNumber(c) {
  var ctor = method(c, '<init>', '(Ljava/lang/String;IZZ)V');
  if (ctor != null) {
    var p = new InsnList();
    p.add(new InsnNode(Opcodes.ICONST_0));
    p.add(new VarInsnNode(Opcodes.ISTORE, 4));
    ctor.instructions.insert(p);
  }
  return c;
}

function injectRegistration(c) {
  var cl = method(c, '<clinit>', '()V');
  if (cl != null) {
    var ret = lastReturn(cl);
    if (ret != null) {
      var p = new InsnList();
      p.add(new MethodInsnNode(Opcodes.INVOKESTATIC, 'dev/mellowb/psieightfold/registry/EightfoldRegistrar', 'registerAll', '()V', false));
      cl.instructions.insertBefore(ret, p);
    }
  }
  return c;
}

function addCrossParam(list, owner, fieldName, key, color, output) {
  list.add(new VarInsnNode(Opcodes.ALOAD, 0));
  list.add(new VarInsnNode(Opcodes.ALOAD, 0));
  list.add(new TypeInsnNode(Opcodes.NEW, 'vazkii/psi/api/spell/param/ParamAny'));
  list.add(new InsnNode(Opcodes.DUP));
  list.add(new LdcInsnNode(key));
  pushInt(list, color);
  list.add(new InsnNode(Opcodes.ICONST_0));
  if (output) {
    list.add(new FieldInsnNode(Opcodes.GETSTATIC, 'vazkii/psi/api/spell/SpellParam$ArrowType', 'NONE', 'Lvazkii/psi/api/spell/SpellParam$ArrowType;'));
    list.add(new MethodInsnNode(Opcodes.INVOKESPECIAL, 'vazkii/psi/api/spell/param/ParamAny', '<init>', '(Ljava/lang/String;IZLvazkii/psi/api/spell/SpellParam$ArrowType;)V', false));
  } else {
    list.add(new MethodInsnNode(Opcodes.INVOKESPECIAL, 'vazkii/psi/api/spell/param/ParamAny', '<init>', '(Ljava/lang/String;IZ)V', false));
  }
  list.add(new InsnNode(Opcodes.DUP_X1));
  list.add(new FieldInsnNode(Opcodes.PUTFIELD, owner, fieldName, PARAM_DESC));
  list.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL, owner, 'addParam', '(' + PARAM_DESC + ')V', false));
}

function patchCrossConnector(c) {
  var owner = 'vazkii/psi/common/spell/other/PieceCrossConnector';
  var names = ['in3','out3','in4','out4'];
  for (var i=0;i<names.length;i++) if (field(c,names[i])==null) c.fields.add(new FieldNode(Opcodes.ACC_PUBLIC,names[i],PARAM_DESC,null,null));

  var init = method(c, 'initParams', '()V');
  if (init != null) {
    var ret = lastReturn(init);
    if (ret != null) {
      var p = new InsnList();
      addCrossParam(p, owner, 'in3', 'psi.spellparam.from3', 4243711, false);
      addCrossParam(p, owner, 'out3', 'psi.spellparam.to3', 4243711, true);
      addCrossParam(p, owner, 'in4', 'psi.spellparam.from4', 16756800, false);
      addCrossParam(p, owner, 'out4', 'psi.spellparam.to4', 16756800, true);
      init.instructions.insertBefore(ret, p);
    }
  }

  var input = method(c, 'isInputSide', '(' + SIDE_DESC + ')Z');
  if (input != null) {
    var cont = new LabelNode();
    var yes = new LabelNode();
    var p2 = new InsnList();
    // side == paramSides.get(in3) || side == paramSides.get(in4)
    p2.add(new VarInsnNode(Opcodes.ALOAD,0)); p2.add(new FieldInsnNode(Opcodes.GETFIELD,owner,'paramSides','Ljava/util/Map;'));
    p2.add(new VarInsnNode(Opcodes.ALOAD,0)); p2.add(new FieldInsnNode(Opcodes.GETFIELD,owner,'in3',PARAM_DESC));
    p2.add(new MethodInsnNode(Opcodes.INVOKEINTERFACE,'java/util/Map','get','(Ljava/lang/Object;)Ljava/lang/Object;',true));
    p2.add(new VarInsnNode(Opcodes.ALOAD,1)); p2.add(new JumpInsnNode(Opcodes.IF_ACMPEQ,yes));
    p2.add(new VarInsnNode(Opcodes.ALOAD,0)); p2.add(new FieldInsnNode(Opcodes.GETFIELD,owner,'paramSides','Ljava/util/Map;'));
    p2.add(new VarInsnNode(Opcodes.ALOAD,0)); p2.add(new FieldInsnNode(Opcodes.GETFIELD,owner,'in4',PARAM_DESC));
    p2.add(new MethodInsnNode(Opcodes.INVOKEINTERFACE,'java/util/Map','get','(Ljava/lang/Object;)Ljava/lang/Object;',true));
    p2.add(new VarInsnNode(Opcodes.ALOAD,1)); p2.add(new JumpInsnNode(Opcodes.IF_ACMPNE,cont));
    p2.add(yes); p2.add(new InsnNode(Opcodes.ICONST_1)); p2.add(new InsnNode(Opcodes.IRETURN));
    p2.add(cont);
    input.instructions.insert(p2);
  }

  var remap = method(c, 'remapSide', '(' + SIDE_DESC + ')' + SIDE_DESC);
  if (remap != null) {
    var cont3 = new LabelNode(); var check4 = new LabelNode();
    var p3 = new InsnList();
    function channel(inField,outField,nextLabel) {
      p3.add(new VarInsnNode(Opcodes.ALOAD,0)); p3.add(new FieldInsnNode(Opcodes.GETFIELD,owner,'paramSides','Ljava/util/Map;'));
      p3.add(new VarInsnNode(Opcodes.ALOAD,0)); p3.add(new FieldInsnNode(Opcodes.GETFIELD,owner,outField,PARAM_DESC));
      p3.add(new MethodInsnNode(Opcodes.INVOKEINTERFACE,'java/util/Map','get','(Ljava/lang/Object;)Ljava/lang/Object;',true));
      p3.add(new TypeInsnNode(Opcodes.CHECKCAST,SIDE));
      p3.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,SIDE,'getOpposite','()'+SIDE_DESC,false));
      p3.add(new VarInsnNode(Opcodes.ALOAD,1)); p3.add(new JumpInsnNode(Opcodes.IF_ACMPNE,nextLabel));
      p3.add(new VarInsnNode(Opcodes.ALOAD,0)); p3.add(new FieldInsnNode(Opcodes.GETFIELD,owner,'paramSides','Ljava/util/Map;'));
      p3.add(new VarInsnNode(Opcodes.ALOAD,0)); p3.add(new FieldInsnNode(Opcodes.GETFIELD,owner,inField,PARAM_DESC));
      p3.add(new MethodInsnNode(Opcodes.INVOKEINTERFACE,'java/util/Map','get','(Ljava/lang/Object;)Ljava/lang/Object;',true));
      p3.add(new TypeInsnNode(Opcodes.CHECKCAST,SIDE)); p3.add(new InsnNode(Opcodes.ARETURN));
    }
    channel('in3','out3',check4); p3.add(check4); channel('in4','out4',cont3); p3.add(cont3);
    remap.instructions.insert(p3);
  }
  return c;
}

function patchGuiProgrammer(c) {
  var m = method(c, 'onSelectedChanged', '()V');
  if (m == null) return c;

  // Replace the hard-coded 4-cardinal-side Set with an Eightfold-expanded Set.
  for (var n=m.instructions.getFirst(); n!=null; n=n.getNext()) {
    if (n instanceof MethodInsnNode && String(n.owner)==='com/google/common/collect/ImmutableSet' && String(n.name)==='of' && String(n.desc).indexOf('Ljava/lang/Object;Ljava/lang/Object;Ljava/lang/Object;Ljava/lang/Object;Ljava/lang/Object;')>=0) {
      var q = new InsnList();
      q.add(new MethodInsnNode(Opcodes.INVOKESTATIC,RUNTIME,'expandSides','(Ljava/util/Set;)Ljava/util/Set;',false));
      m.instructions.insert(n,q);
      // The next iterator call must target java.util.Set because expandSides
      // returns a LinkedHashSet, not Guava's ImmutableSet.
      for (var z=n.getNext(); z!=null; z=z.getNext()) {
        if (z instanceof MethodInsnNode && String(z.name)==='iterator') {
          z.setOpcode(Opcodes.INVOKEINTERFACE); z.owner='java/util/Set'; z.desc='()Ljava/util/Iterator;'; z.itf=true; break;
        }
      }
      break;
    }
  }

  var xDone=false, yDone=false;
  for (var a=m.instructions.getFirst(); a!=null; a=a.getNext()) {
    if (!xDone && a instanceof VarInsnNode && a.getOpcode()===Opcodes.ISTORE && a.var===6) {
      var px=new InsnList(); px.add(new VarInsnNode(Opcodes.ILOAD,6)); px.add(new VarInsnNode(Opcodes.ILOAD,2));
      px.add(new MethodInsnNode(Opcodes.INVOKESTATIC,RUNTIME,'paramX','(II)I',false)); px.add(new VarInsnNode(Opcodes.ISTORE,6));
      m.instructions.insert(a,px); xDone=true;
    } else if (!yDone && a instanceof VarInsnNode && a.getOpcode()===Opcodes.ISTORE && a.var===7) {
      var py=new InsnList(); py.add(new VarInsnNode(Opcodes.ILOAD,7)); py.add(new VarInsnNode(Opcodes.ILOAD,2));
      py.add(new MethodInsnNode(Opcodes.INVOKESTATIC,RUNTIME,'paramY','(II)I',false)); py.add(new VarInsnNode(Opcodes.ISTORE,7));
      m.instructions.insert(a,py); yDone=true;
    }
    if (xDone&&yDone) break;
  }
  return c;
}

function patchSideConfigWidget(c) {
  var m=method(c,'renderWidget','(Lnet/minecraft/client/gui/GuiGraphics;IIF)V');
  if(m==null) return c;

  // Draw a second copy of Psi's own panel background when parameters 5-8 exist.
  for(var n=m.instructions.getFirst();n!=null;n=n.getNext()){
    if(n instanceof MethodInsnNode && String(n.owner)==='net/minecraft/client/gui/GuiGraphics' && String(n.name)==='blit' && String(n.desc)==='(Lnet/minecraft/resources/ResourceLocation;IIIIII)V'){
      var skip=new LabelNode(); var p=new InsnList();
      p.add(new VarInsnNode(Opcodes.ALOAD,5)); p.add(new JumpInsnNode(Opcodes.IFNULL,skip));
      p.add(new VarInsnNode(Opcodes.ALOAD,5)); p.add(new FieldInsnNode(Opcodes.GETFIELD,'vazkii/psi/api/spell/SpellPiece','params','Ljava/util/Map;'));
      p.add(new MethodInsnNode(Opcodes.INVOKEINTERFACE,'java/util/Map','size','()I',true)); pushInt(p,4); p.add(new JumpInsnNode(Opcodes.IF_ICMPLE,skip));
      p.add(new VarInsnNode(Opcodes.ALOAD,1)); p.add(new FieldInsnNode(Opcodes.GETSTATIC,'vazkii/psi/client/gui/GuiProgrammer','texture','Lnet/minecraft/resources/ResourceLocation;'));
      p.add(new VarInsnNode(Opcodes.ALOAD,0)); p.add(new FieldInsnNode(Opcodes.GETFIELD,'vazkii/psi/client/gui/widget/SideConfigWidget','parent','Lvazkii/psi/client/gui/GuiProgrammer;'));
      p.add(new FieldInsnNode(Opcodes.GETFIELD,'vazkii/psi/client/gui/GuiProgrammer','left','I')); pushInt(p,162); p.add(new InsnNode(Opcodes.ISUB));
      p.add(new VarInsnNode(Opcodes.ALOAD,0)); p.add(new FieldInsnNode(Opcodes.GETFIELD,'vazkii/psi/client/gui/widget/SideConfigWidget','parent','Lvazkii/psi/client/gui/GuiProgrammer;'));
      p.add(new FieldInsnNode(Opcodes.GETFIELD,'vazkii/psi/client/gui/GuiProgrammer','top','I')); pushInt(p,55); p.add(new InsnNode(Opcodes.IADD));
      p.add(new VarInsnNode(Opcodes.ALOAD,0)); p.add(new FieldInsnNode(Opcodes.GETFIELD,'vazkii/psi/client/gui/widget/SideConfigWidget','parent','Lvazkii/psi/client/gui/GuiProgrammer;'));
      p.add(new FieldInsnNode(Opcodes.GETFIELD,'vazkii/psi/client/gui/GuiProgrammer','xSize','I')); pushInt(p,30); pushInt(p,81); pushInt(p,115);
      p.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,'net/minecraft/client/gui/GuiGraphics','blit','(Lnet/minecraft/resources/ResourceLocation;IIIIII)V',false));
      p.add(skip); m.instructions.insert(n,p); break;
    }
  }

  var xDone=false,yDone=false;
  for(var a=m.instructions.getFirst();a!=null;a=a.getNext()){
    if(!xDone && a instanceof VarInsnNode && a.getOpcode()===Opcodes.ISTORE && a.var===11){
      var px=new InsnList(); px.add(new VarInsnNode(Opcodes.ILOAD,11)); px.add(new VarInsnNode(Opcodes.ILOAD,7));
      px.add(new MethodInsnNode(Opcodes.INVOKESTATIC,RUNTIME,'paramX','(II)I',false)); px.add(new VarInsnNode(Opcodes.ISTORE,11)); m.instructions.insert(a,px); xDone=true;
    } else if(!yDone && a instanceof VarInsnNode && a.getOpcode()===Opcodes.ISTORE && a.var===12){
      var py=new InsnList(); py.add(new VarInsnNode(Opcodes.ILOAD,12)); py.add(new VarInsnNode(Opcodes.ILOAD,7));
      py.add(new MethodInsnNode(Opcodes.INVOKESTATIC,RUNTIME,'paramY','(II)I',false)); py.add(new VarInsnNode(Opcodes.ISTORE,12)); m.instructions.insert(a,py); yDone=true;
    }
    if(xDone&&yDone) break;
  }
  return c;
}

function patchSideButton(c) {
  var m=method(c,'renderWidget','(Lnet/minecraft/client/gui/GuiGraphics;IIF)V');
  if(m==null) return c;
  for(var n=m.instructions.getFirst();n!=null;n=n.getNext()){
    if(n instanceof FieldInsnNode && n.getOpcode()===Opcodes.GETSTATIC && String(n.owner)==='vazkii/psi/client/gui/GuiProgrammer' && String(n.name)==='texture'){
      var vanilla=new LabelNode(); var after=new LabelNode(); var p=new InsnList();
      p.add(new VarInsnNode(Opcodes.ALOAD,0)); p.add(new FieldInsnNode(Opcodes.GETFIELD,'vazkii/psi/client/gui/button/GuiButtonSideConfig','side',SIDE_DESC));
      p.add(new MethodInsnNode(Opcodes.INVOKESTATIC,RUNTIME,'isDiagonal','('+SIDE_DESC+')Z',false)); p.add(new JumpInsnNode(Opcodes.IFEQ,vanilla));
      p.add(new LdcInsnNode('psieightfold')); p.add(new LdcInsnNode('textures/gui/diagonal_arrows.png'));
      p.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'net/minecraft/resources/ResourceLocation','fromNamespaceAndPath','(Ljava/lang/String;Ljava/lang/String;)Lnet/minecraft/resources/ResourceLocation;',false));
      p.add(new JumpInsnNode(Opcodes.GOTO,after)); p.add(vanilla);
      p.add(new FieldInsnNode(Opcodes.GETSTATIC,'vazkii/psi/client/gui/GuiProgrammer','texture','Lnet/minecraft/resources/ResourceLocation;')); p.add(after);
      m.instructions.insertBefore(n,p); m.instructions.remove(n); break;
    }
  }
  return c;
}

function patchRenderLayer(c){
  var rt='Lnet/minecraft/client/renderer/RenderType;';
  if(field(c,'eightfoldProgrammer')==null)c.fields.add(new FieldNode(Opcodes.ACC_PRIVATE|Opcodes.ACC_STATIC,'eightfoldProgrammer',rt,null,null));
  if(method(c,'eightfoldProgrammer','()'+rt)==null){
    var m=new MethodNode(Opcodes.ACC_PUBLIC|Opcodes.ACC_STATIC,'eightfoldProgrammer','()'+rt,null,null); var ready=new LabelNode();
    m.instructions.add(new FieldInsnNode(Opcodes.GETSTATIC,'vazkii/psi/client/render/spell/SpellPieceRenderLayer','eightfoldProgrammer',rt));
    m.instructions.add(new JumpInsnNode(Opcodes.IFNONNULL,ready));
    m.instructions.add(new LdcInsnNode('psieightfold')); m.instructions.add(new LdcInsnNode('textures/gui/diagonal_arrows.png'));
    m.instructions.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'net/minecraft/resources/ResourceLocation','fromNamespaceAndPath','(Ljava/lang/String;Ljava/lang/String;)Lnet/minecraft/resources/ResourceLocation;',false));
    m.instructions.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'net/minecraft/client/renderer/RenderType','text','(Lnet/minecraft/resources/ResourceLocation;)Lnet/minecraft/client/renderer/RenderType;',false));
    m.instructions.add(new FieldInsnNode(Opcodes.PUTSTATIC,'vazkii/psi/client/render/spell/SpellPieceRenderLayer','eightfoldProgrammer',rt));
    m.instructions.add(ready); m.instructions.add(new FieldInsnNode(Opcodes.GETSTATIC,'vazkii/psi/client/render/spell/SpellPieceRenderLayer','eightfoldProgrammer',rt)); m.instructions.add(new InsnNode(Opcodes.ARETURN));
    m.maxStack=2;m.maxLocals=0;c.methods.add(m);
  }
  return c;
}

function writeVertex(list, x, y, uLocal, vLocal) {
  list.add(new VarInsnNode(Opcodes.ALOAD,6)); list.add(new VarInsnNode(Opcodes.ALOAD,12));
  if(x===0) list.add(new InsnNode(Opcodes.FCONST_0)); else { pushInt(list,16); list.add(new InsnNode(Opcodes.I2F)); }
  if(y===0) list.add(new InsnNode(Opcodes.FCONST_0)); else { pushInt(list,16); list.add(new InsnNode(Opcodes.I2F)); }
  list.add(new VarInsnNode(Opcodes.FLOAD,uLocal)); list.add(new VarInsnNode(Opcodes.FLOAD,vLocal));
  list.add(new VarInsnNode(Opcodes.FLOAD,9)); list.add(new VarInsnNode(Opcodes.FLOAD,10)); list.add(new VarInsnNode(Opcodes.FLOAD,11)); list.add(new VarInsnNode(Opcodes.ILOAD,2));
  list.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'vazkii/psi/client/render/spell/SpellPieceRenderer','vertex','(Lcom/mojang/blaze3d/vertex/VertexConsumer;Lorg/joml/Matrix4f;FFFFFFFI)V',false));
}

function patchRenderer(c){
  var drawParams=method(c,'drawParams','(Lvazkii/psi/api/spell/SpellPiece;Lcom/mojang/blaze3d/vertex/PoseStack;Lnet/minecraft/client/renderer/MultiBufferSource;I)V');
  if(drawParams!=null){
    for(var call=drawParams.instructions.getFirst();call!=null;call=call.getNext()){
      if(call instanceof MethodInsnNode && String(call.owner)==='vazkii/psi/client/render/spell/SpellPieceRenderer' && String(call.name)==='drawParam' && String(call.desc).indexOf('VertexConsumer')>=0){
        var load=call.getPrevious();
        while(load!=null && !(load instanceof VarInsnNode && load.getOpcode()===Opcodes.ALOAD && load.var===4)) load=load.getPrevious();
        if(load!=null){
          var vanilla=new LabelNode(), after=new LabelNode(), p=new InsnList();
          p.add(new VarInsnNode(Opcodes.ALOAD,0)); p.add(new FieldInsnNode(Opcodes.GETFIELD,'vazkii/psi/api/spell/SpellPiece','paramSides','Ljava/util/Map;'));
          p.add(new VarInsnNode(Opcodes.ALOAD,6)); p.add(new MethodInsnNode(Opcodes.INVOKEINTERFACE,'java/util/Map','get','(Ljava/lang/Object;)Ljava/lang/Object;',true)); p.add(new TypeInsnNode(Opcodes.CHECKCAST,SIDE));
          p.add(new MethodInsnNode(Opcodes.INVOKESTATIC,RUNTIME,'isDiagonal','('+SIDE_DESC+')Z',false)); p.add(new JumpInsnNode(Opcodes.IFEQ,vanilla));
          p.add(new VarInsnNode(Opcodes.ALOAD,2)); p.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'vazkii/psi/client/render/spell/SpellPieceRenderLayer','eightfoldProgrammer','()Lnet/minecraft/client/renderer/RenderType;',false));
          p.add(new MethodInsnNode(Opcodes.INVOKEINTERFACE,'net/minecraft/client/renderer/MultiBufferSource','getBuffer','(Lnet/minecraft/client/renderer/RenderType;)Lcom/mojang/blaze3d/vertex/VertexConsumer;',true)); p.add(new JumpInsnNode(Opcodes.GOTO,after));
          p.add(vanilla); p.add(new VarInsnNode(Opcodes.ALOAD,4)); p.add(after);
          drawParams.instructions.insertBefore(load,p); drawParams.instructions.remove(load);
        }
        break;
      }
    }
  }

  // Independent Eightfold connector-line renderer using an Eightfold-owned PNG.
  var m=method(c,'drawConnectorSide','(Lcom/mojang/blaze3d/vertex/PoseStack;Lnet/minecraft/client/renderer/MultiBufferSource;ILvazkii/psi/api/spell/SpellParam$Side;I)V');
  if(m!=null){
    m.instructions.clear(); m.tryCatchBlocks.clear(); m.localVariables=null;
    var enabled=new LabelNode();
    m.instructions.add(new VarInsnNode(Opcodes.ALOAD,3)); m.instructions.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,SIDE,'isEnabled','()Z',false)); m.instructions.add(new JumpInsnNode(Opcodes.IFNE,enabled)); m.instructions.add(new InsnNode(Opcodes.RETURN)); m.instructions.add(enabled);
    // buffer = buffers.getBuffer(RenderType.text(psieightfold connector texture))
    m.instructions.add(new VarInsnNode(Opcodes.ALOAD,1)); m.instructions.add(new LdcInsnNode('psieightfold')); m.instructions.add(new LdcInsnNode('textures/spell/connector_lines.png'));
    m.instructions.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'net/minecraft/resources/ResourceLocation','fromNamespaceAndPath','(Ljava/lang/String;Ljava/lang/String;)Lnet/minecraft/resources/ResourceLocation;',false));
    m.instructions.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'net/minecraft/client/renderer/RenderType','text','(Lnet/minecraft/resources/ResourceLocation;)Lnet/minecraft/client/renderer/RenderType;',false));
    m.instructions.add(new MethodInsnNode(Opcodes.INVOKEINTERFACE,'net/minecraft/client/renderer/MultiBufferSource','getBuffer','(Lnet/minecraft/client/renderer/RenderType;)Lcom/mojang/blaze3d/vertex/VertexConsumer;',true)); m.instructions.add(new VarInsnNode(Opcodes.ASTORE,6));
    m.instructions.add(new VarInsnNode(Opcodes.ALOAD,3)); m.instructions.add(new MethodInsnNode(Opcodes.INVOKESTATIC,RUNTIME,'connectorU','('+SIDE_DESC+')F',false)); m.instructions.add(new VarInsnNode(Opcodes.FSTORE,7));
    m.instructions.add(new VarInsnNode(Opcodes.ALOAD,3)); m.instructions.add(new MethodInsnNode(Opcodes.INVOKESTATIC,RUNTIME,'connectorV','('+SIDE_DESC+')F',false)); m.instructions.add(new VarInsnNode(Opcodes.FSTORE,8));
    m.instructions.add(new VarInsnNode(Opcodes.ILOAD,4)); m.instructions.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'vazkii/psi/api/internal/PsiRenderHelper','r','(I)I',false)); m.instructions.add(new InsnNode(Opcodes.I2F)); pushInt(m.instructions,255); m.instructions.add(new InsnNode(Opcodes.I2F)); m.instructions.add(new InsnNode(Opcodes.FDIV)); m.instructions.add(new VarInsnNode(Opcodes.FSTORE,9));
    m.instructions.add(new VarInsnNode(Opcodes.ILOAD,4)); m.instructions.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'vazkii/psi/api/internal/PsiRenderHelper','g','(I)I',false)); m.instructions.add(new InsnNode(Opcodes.I2F)); pushInt(m.instructions,255); m.instructions.add(new InsnNode(Opcodes.I2F)); m.instructions.add(new InsnNode(Opcodes.FDIV)); m.instructions.add(new VarInsnNode(Opcodes.FSTORE,10));
    m.instructions.add(new VarInsnNode(Opcodes.ILOAD,4)); m.instructions.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'vazkii/psi/api/internal/PsiRenderHelper','b','(I)I',false)); m.instructions.add(new InsnNode(Opcodes.I2F)); pushInt(m.instructions,255); m.instructions.add(new InsnNode(Opcodes.I2F)); m.instructions.add(new InsnNode(Opcodes.FDIV)); m.instructions.add(new VarInsnNode(Opcodes.FSTORE,11));
    m.instructions.add(new VarInsnNode(Opcodes.ALOAD,0)); m.instructions.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,'com/mojang/blaze3d/vertex/PoseStack','last','()Lcom/mojang/blaze3d/vertex/PoseStack$Pose;',false)); m.instructions.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,'com/mojang/blaze3d/vertex/PoseStack$Pose','pose','()Lorg/joml/Matrix4f;',false)); m.instructions.add(new VarInsnNode(Opcodes.ASTORE,12));
    // u1/v1 = origin + 0.25 (one 16px tile in a 64px sheet)
    m.instructions.add(new VarInsnNode(Opcodes.FLOAD,7)); m.instructions.add(new InsnNode(Opcodes.FCONST_1)); pushInt(m.instructions,4); m.instructions.add(new InsnNode(Opcodes.I2F)); m.instructions.add(new InsnNode(Opcodes.FDIV)); m.instructions.add(new InsnNode(Opcodes.FADD)); m.instructions.add(new VarInsnNode(Opcodes.FSTORE,13));
    m.instructions.add(new VarInsnNode(Opcodes.FLOAD,8)); m.instructions.add(new InsnNode(Opcodes.FCONST_1)); pushInt(m.instructions,4); m.instructions.add(new InsnNode(Opcodes.I2F)); m.instructions.add(new InsnNode(Opcodes.FDIV)); m.instructions.add(new InsnNode(Opcodes.FADD)); m.instructions.add(new VarInsnNode(Opcodes.FSTORE,14));
    writeVertex(m.instructions,0,16,7,14); writeVertex(m.instructions,16,16,13,14); writeVertex(m.instructions,16,0,13,8); writeVertex(m.instructions,0,0,7,8);
    m.instructions.add(new InsnNode(Opcodes.RETURN)); m.maxStack=10; m.maxLocals=15;
  }

  // Extend Psi's existing cross-connector render with channels 3 and 4.
  var cross=method(c,'drawCrossConnector','(Lvazkii/psi/common/spell/other/PieceCrossConnector;Lcom/mojang/blaze3d/vertex/PoseStack;Lnet/minecraft/client/renderer/MultiBufferSource;I)V');
  if(cross!=null){
    var ret=lastReturn(cross); if(ret!=null){
      var owner='vazkii/psi/common/spell/other/PieceCrossConnector'; var p4=new InsnList();
      function drawField(fieldName,color){
        p4.add(new VarInsnNode(Opcodes.ALOAD,1)); p4.add(new VarInsnNode(Opcodes.ALOAD,2)); p4.add(new VarInsnNode(Opcodes.ILOAD,3));
        p4.add(new VarInsnNode(Opcodes.ALOAD,0)); p4.add(new FieldInsnNode(Opcodes.GETFIELD,owner,'paramSides','Ljava/util/Map;'));
        p4.add(new VarInsnNode(Opcodes.ALOAD,0)); p4.add(new FieldInsnNode(Opcodes.GETFIELD,owner,fieldName,PARAM_DESC));
        p4.add(new MethodInsnNode(Opcodes.INVOKEINTERFACE,'java/util/Map','get','(Ljava/lang/Object;)Ljava/lang/Object;',true)); p4.add(new TypeInsnNode(Opcodes.CHECKCAST,SIDE)); pushInt(p4,color);
        p4.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'vazkii/psi/client/render/spell/SpellPieceRenderer','drawConnectorSide','(Lcom/mojang/blaze3d/vertex/PoseStack;Lnet/minecraft/client/renderer/MultiBufferSource;ILvazkii/psi/api/spell/SpellParam$Side;I)V',false));
      }
      drawField('in3',4243711); drawField('out3',4243711); drawField('in4',16756800); drawField('out4',16756800);
      cross.instructions.insertBefore(ret,p4);
    }
  }
  return c;
}

function initializeCoreMod(){
  return {
    'eightfold_condition_guard': {target:{type:'CLASS',name:'vazkii.psi.api.spell.CompiledSpell$Action'},transformer:injectConditionGuards},
    'eightfold_sides': {target:{type:'CLASS',name:'vazkii.psi.api.spell.SpellParam$Side'},transformer:extendSideEnum},
    'eightfold_spellpiece_hooks': {target:{type:'CLASS',name:'vazkii.psi.api.spell.SpellPiece'},transformer:patchSpellPiece},
    'eightfold_dynamic_numbers': {target:{type:'CLASS',name:'vazkii.psi.api.spell.param.ParamNumber'},transformer:patchParamNumber},
    'eightfold_cross_connector': {target:{type:'CLASS',name:'vazkii.psi.common.spell.other.PieceCrossConnector'},transformer:patchCrossConnector},
    'eightfold_register_pieces': {target:{type:'CLASS',name:'vazkii.psi.common.spell.base.ModSpellPieces'},transformer:injectRegistration},
    'eightfold_programmer_config': {target:{type:'CLASS',name:'vazkii.psi.client.gui.GuiProgrammer'},transformer:patchGuiProgrammer},
    'eightfold_config_panel': {target:{type:'CLASS',name:'vazkii.psi.client.gui.widget.SideConfigWidget'},transformer:patchSideConfigWidget},
    'eightfold_side_button': {target:{type:'CLASS',name:'vazkii.psi.client.gui.button.GuiButtonSideConfig'},transformer:patchSideButton},
    'eightfold_render_layer': {target:{type:'CLASS',name:'vazkii.psi.client.render.spell.SpellPieceRenderLayer'},transformer:patchRenderLayer},
    'eightfold_renderer': {target:{type:'CLASS',name:'vazkii.psi.client.render.spell.SpellPieceRenderer'},transformer:patchRenderer}
  };
}

User {
id: UniqeString,
name: String,
profileImg: String
}
Rabotory {
id: UniqeString,
title: String,
makerId: String,
objects: Objects[],
backgroundImg:String,
combinate:String[][],
endObj: String[],
like:String[]
createdAt:Time,
updatedAt:Time
}
Objects {
id:String,
name:String,
img:String
}
UpdateRabotory {
title: String,
objects: Objects[],
backgroundImg:String,
combinate:String[][],
endObj: String[],
}
CreateRabotory {
title: String,
makerId: String,
objects: Objects[],
backgroundImg:String,
combinate:String[][],
endObj: String[],
}

-Rabotory

1. getListOrderedByLike() => Rabotory[]
2. getListOrderedByNewest() => Rabotory[]
3. getOneById(id:String) => Rabotory
4. getListByMakerId(makerId:String) => Rabotory[]
5. createRabotory(data:CreateRabotory)
6. updateRabotoryObject(data:UpdateRabotory)
7. updateRabotoryLike(id:String)
8. DeleteRabotoryById(id:String)

-User

1. getUser(id:String) => User
2. createUser(name:String,profileImg:String)
3. updateUser(name:String,profileImg:String)
4. deleteUser(id:String)

Test {
id:UniqeString,
title:String,
description:String
}

-Test

1. getTest(id:String) => Test
2. createTest(data:Test)
